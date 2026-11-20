import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { db } from '@/db/client';
import { lists, listItems, movies } from '@/db/schema';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { z } from 'zod';

export async function listRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  
  // GET /api/v1/lists - Listas do usuário
  typedApp.get<{ 
    Querystring: { cursor?: string; limit: number }
  }>(
    '/',
    {
      schema: {
        querystring: z.object({
          cursor: z.string().optional(),
          limit: z.coerce.number().int().positive().max(50).default(20),
        }),
      },
      preHandler: [app.authMiddleware],
    },
    async (request, reply) => {
      const { cursor, limit } = request.query;
      const userId = request.user!.id;

      // Fetch lists using Drizzle query API
      const results = await db.query.lists.findMany({
        where: and(eq(lists.userId, userId), isNull(lists.deletedAt)),
        orderBy: (list) => [desc(list.updatedAt)],
        limit: limit + 1,
        with: {
          items: true,
        },
      });

      if (cursor) {
        const cursorList = results.find(l => l.id === cursor);
        if (!cursorList) {
          return reply.send({ success: true, data: { items: [], cursor: null } });
        }
        // Filter to items after cursor (by updatedAt)
        const cursorIndex = results.findIndex(l => l.id === cursor);
        const filteredResults = results.slice(cursorIndex + 1);
        const hasMore = filteredResults.length > limit;
        const items = hasMore ? filteredResults.slice(0, limit) : filteredResults;
        const nextCursor = hasMore ? items[items.length - 1].id : null;
        
        return reply.send({
          success: true,
          data: {
            items: items.map(l => ({
              id: l.id,
              userId: l.userId,
              name: l.name,
              createdAt: l.createdAt.toISOString(),
              updatedAt: l.updatedAt.toISOString(),
              deletedAt: l.deletedAt?.toISOString() ?? null,
              _count: { items: l.items?.length ?? 0 },
            })),
            cursor: nextCursor,
          },
        });
      }

      const hasMore = results.length > limit;
      const items = hasMore ? results.slice(0, limit) : results;
      const nextCursor = hasMore ? items[items.length - 1].id : null;

      return reply.send({
        success: true,
        data: {
          items: items.map(l => ({
            id: l.id,
            userId: l.userId,
            name: l.name,
            createdAt: l.createdAt.toISOString(),
            updatedAt: l.updatedAt.toISOString(),
            deletedAt: l.deletedAt?.toISOString() ?? null,
            _count: { items: l.items?.length ?? 0 },
          })),
          cursor: nextCursor,
        },
      });
    }
  );

  // POST /api/v1/lists - Criar lista
  typedApp.post<{ 
    Body: { name: string }
  }>(
    '/',
    { 
      schema: { 
        body: z.object({
          name: z.string().min(1).max(100),
          visibility: z.enum(['private', 'shared']).default('private'),
        }),
      },
      preHandler: [app.authMiddleware],
    },
    async (request, reply) => {
      const { name } = request.body;
      const userId = request.user!.id;

      try {
        const [list] = await db
          .insert(lists)
          .values({ userId, name })
          .returning();

        return reply.status(201).send({
          id: list.id,
          userId: list.userId,
          name: list.name,
          createdAt: list.createdAt.toISOString(),
          updatedAt: list.updatedAt.toISOString(),
          deletedAt: null,
          _count: { items: 0 },
        });
      } catch (error: any) {
        if (error.message.includes('unique constraint') || error.message.includes('duplicate key')) {
          return reply.status(409).send({
            success: false,
            error: { code: 'LIST_NAME_EXISTS', message: 'A list with this name already exists', permanent: true },
          });
        }
        throw error;
      }
    }
  );

  // DELETE /api/v1/lists/:id - Soft delete lista
  typedApp.delete<{ 
    Params: { id: string }
  }>(
    '/:id',
    { 
      schema: { 
        params: z.object({ id: z.string().uuid() }),
      },
      preHandler: [app.authMiddleware],
    },
    async (request, reply) => {
      const { id } = request.params;
      const userId = request.user!.id;

      const [list] = await db
        .update(lists)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(lists.id, id), eq(lists.userId, userId)))
        .returning();

      if (!list) {
        return reply.status(404).send({
          success: false,
          error: { code: 'LIST_NOT_FOUND', message: 'List not found', permanent: true },
        });
      }

      return reply.send({ success: true, data: { message: 'List deleted' } });
    }
  );

  // POST /api/v1/lists/:id/items - Adicionar filme à lista
  typedApp.post<{ 
    Params: { id: string };
    Body: { movieId: string }
  }>(
    '/:id/items',
    { 
      schema: { 
        body: z.object({ movieId: z.string().uuid() }),
      },
      preHandler: [app.authMiddleware],
    },
    async (request, reply) => {
      const { id: listId } = request.params;
      const { movieId } = request.body;
      const userId = request.user!.id;

      const list = await db.query.lists.findFirst({
        where: and(eq(lists.id, listId), eq(lists.userId, userId), isNull(lists.deletedAt)),
      });

      if (!list) {
        return reply.status(404).send({
          success: false,
          error: { code: 'LIST_NOT_FOUND', message: 'List not found', permanent: true },
        });
      }

      const [movie] = await db.select().from(movies).where(eq(movies.id, movieId)).limit(1);
      if (!movie || movie.deletedAt) {
        return reply.status(404).send({
          success: false,
          error: { code: 'MOVIE_NOT_FOUND', message: 'Movie not found', permanent: true },
        });
      }

      try {
        await db.insert(listItems).values({ listId, movieId }).onConflictDoNothing();
      } catch (error: any) {
        if (error.message.includes('foreign key')) {
          return reply.status(400).send({
            success: false,
            error: { code: 'INVALID_MOVIE', message: 'Invalid movie reference', permanent: true },
          });
        }
        throw error;
      }

      return reply.status(201).send({ success: true, data: { message: 'Movie added to list' } });
    }
  );

  // DELETE /api/v1/lists/:id/items/:movieId - Remover filme da lista
  typedApp.delete<{ 
    Params: { id: string; movieId: string }
  }>(
    '/:id/items/:movieId',
    { 
      schema: { 
        params: z.object({ id: z.string().uuid(), movieId: z.string().uuid() }),
      },
      preHandler: [app.authMiddleware],
    },
    async (request, reply) => {
      const { id: listId, movieId } = request.params;
      const userId = request.user!.id;

      const list = await db.query.lists.findFirst({
        where: and(eq(lists.id, listId), eq(lists.userId, userId), isNull(lists.deletedAt)),
      });

      if (!list) {
        return reply.status(404).send({
          success: false,
          error: { code: 'LIST_NOT_FOUND', message: 'List not found', permanent: true },
        });
      }

      await db.delete(listItems).where(and(eq(listItems.listId, listId), eq(listItems.movieId, movieId)));

      return reply.send({ success: true, data: { message: 'Movie removed from list' } });
    }
  );
}