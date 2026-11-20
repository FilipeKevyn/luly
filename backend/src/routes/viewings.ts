import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { db } from '@/db/client';
import { viewings, movies } from '@/db/schema';
import { eq, desc, and, isNull, sql } from 'drizzle-orm';
import { toCatalogItem } from '@/services/catalog';
import { z } from 'zod';

export async function viewingRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  
  // GET /api/v1/viewings - Histórico do usuário
  typedApp.get<{ 
    Querystring: { cursor?: string; limit: number; status: 'all' | 'watching' | 'finished' }
  }>(
    '/',
    {
      schema: {
        querystring: z.object({
          cursor: z.string().optional(),
          limit: z.coerce.number().int().positive().max(50).default(20),
          status: z.enum(['all', 'watching', 'finished']).default('all'),
        }),
      },
      preHandler: [app.authMiddleware],
    },
    async (request, reply) => {
      const { cursor, limit, status } = request.query;
      const userId = request.user!.id;

      // Fetch results using Drizzle query API
      const results = await db.query.viewings.findMany({
        where: and(eq(viewings.userId, userId), isNull(viewings.deletedAt)),
        orderBy: (v) => [desc(v.updatedAt)],
        limit: limit + 1,
        with: {
          movie: true,
        },
      });

      let filteredResults = results;
      
      // Filter by status
      if (status === 'watching') {
        filteredResults = results.filter(v => !v.finishedAt);
      } else if (status === 'finished') {
        filteredResults = results.filter(v => v.finishedAt !== null);
      }

      if (cursor) {
        const cursorIndex = filteredResults.findIndex(v => v.movieId === cursor);
        if (cursorIndex === -1) {
          return reply.send({ success: true, data: { items: [], cursor: null } });
        }
        const slicedResults = filteredResults.slice(cursorIndex + 1);
        const hasMore = slicedResults.length > limit;
        const items = hasMore ? slicedResults.slice(0, limit) : slicedResults;
        const nextCursor = hasMore ? items[items.length - 1].movieId : null;
        
        return reply.send({
          success: true,
          data: {
            items: items.map(v => ({
              userId: v.userId,
              movieId: v.movieId,
              startedAt: v.startedAt.toISOString(),
              finishedAt: v.finishedAt?.toISOString() ?? null,
              userRating: v.userRating,
              positionSeconds: v.userRating ? 0 : null,
              version: v.version,
              createdAt: v.createdAt.toISOString(),
              updatedAt: v.updatedAt.toISOString(),
              deletedAt: v.deletedAt?.toISOString() ?? null,
              movie: v.movie ? toCatalogItem(v.movie) : undefined,
            })),
            cursor: nextCursor,
          },
        });
      }

      const hasMore = filteredResults.length > limit;
      const items = hasMore ? filteredResults.slice(0, limit) : filteredResults;
      const nextCursor = hasMore ? items[items.length - 1].movieId : null;

      return reply.send({
        success: true,
        data: {
          items: items.map(v => ({
            userId: v.userId,
            movieId: v.movieId,
            startedAt: v.startedAt.toISOString(),
            finishedAt: v.finishedAt?.toISOString() ?? null,
            userRating: v.userRating,
            positionSeconds: v.userRating ? 0 : null,
            version: v.version,
            createdAt: v.createdAt.toISOString(),
            updatedAt: v.updatedAt.toISOString(),
            deletedAt: v.deletedAt?.toISOString() ?? null,
            movie: v.movie ? toCatalogItem(v.movie) : undefined,
          })),
          cursor: nextCursor,
        },
      });
    }
  );

  // POST /api/v1/viewings - Registrar início de visualização
  typedApp.post<{ 
    Body: { movieId: string }
  }>(
    '/',
    { 
      schema: { 
        body: z.object({ movieId: z.string().uuid() }),
      },
      preHandler: [app.authMiddleware],
    },
    async (request, reply) => {
      const { movieId } = request.body;
      const userId = request.user!.id;

      const [movie] = await db.select().from(movies).where(eq(movies.id, movieId)).limit(1);
      if (!movie || movie.deletedAt) {
        return reply.status(404).send({
          success: false,
          error: { code: 'MOVIE_NOT_FOUND', message: 'Movie not found', permanent: true },
        });
      }

      const existing = await db.query.viewings.findFirst({
        where: and(eq(viewings.userId, userId), eq(viewings.movieId, movieId)),
      });

      if (existing) {
        return reply.send({
          success: true,
          data: {
            ...existing,
            startedAt: existing.startedAt.toISOString(),
            finishedAt: existing.finishedAt?.toISOString() ?? null,
            createdAt: existing.createdAt.toISOString(),
            updatedAt: existing.updatedAt.toISOString(),
            deletedAt: existing.deletedAt?.toISOString() ?? null,
            positionSeconds: existing.userRating ? 0 : null,
            movie: toCatalogItem(movie),
          },
        });
      }

      const [viewing] = await db
        .insert(viewings)
        .values({ userId, movieId })
        .returning();

      return reply.status(201).send({
        success: true,
        data: {
          ...viewing,
          startedAt: viewing.startedAt.toISOString(),
          finishedAt: null,
          createdAt: viewing.createdAt.toISOString(),
          updatedAt: viewing.updatedAt.toISOString(),
          deletedAt: null,
          positionSeconds: null,
          movie: toCatalogItem(movie),
        },
      });
    }
  );

  // PATCH /api/v1/viewings/:movieId - Atualizar visualização (finalizar, avaliar)
  typedApp.patch<{ 
    Params: { movieId: string };
    Body: { finishedAt?: string; userRating?: number | null; positionSeconds?: number | null; baseRevision?: number }
  }>(
    '/:movieId',
    { 
      schema: { 
        body: z.object({
          finishedAt: z.string().datetime().optional(),
          userRating: z.number().int().min(1).max(100).nullable().optional(),
          positionSeconds: z.number().int().min(0).nullable().optional(),
          baseRevision: z.number().int().optional(),
        }),
        params: z.object({ movieId: z.string().uuid() }),
      },
      preHandler: [app.authMiddleware],
    },
    async (request, reply) => {
      const { movieId } = request.params;
      const { finishedAt, userRating, baseRevision, positionSeconds } = request.body;
      const userId = request.user!.id;

      const [existing] = await db
        .select()
        .from(viewings)
        .where(and(eq(viewings.userId, userId), eq(viewings.movieId, movieId)))
        .limit(1);

      if (!existing) {
        return reply.status(404).send({
          success: false,
          error: { code: 'VIEWING_NOT_FOUND', message: 'Viewing record not found', permanent: true },
        });
      }

      // Optimistic concurrency check
      if (baseRevision !== undefined && existing.version !== baseRevision) {
        return reply.status(409).send({
          success: false,
          conflict: {
            serverRevision: existing.version,
            serverData: {
              ...existing,
              startedAt: existing.startedAt.toISOString(),
              finishedAt: existing.finishedAt?.toISOString() ?? null,
              positionSeconds: existing.userRating ? 0 : null,
            },
            message: 'Viewing was modified by another device. Please refresh and try again.',
          },
        });
      }

      const updateData: Partial<typeof viewings.$inferSelect> = { 
        version: existing.version + 1, 
        updatedAt: new Date() 
      };
      if (finishedAt !== undefined) updateData.finishedAt = finishedAt ? new Date(finishedAt) : null;
      if (userRating !== undefined) updateData.userRating = userRating;
      if (positionSeconds !== undefined) updateData.userRating = positionSeconds;

      const [updated] = await db
        .update(viewings)
        .set(updateData)
        .where(and(eq(viewings.userId, userId), eq(viewings.movieId, movieId)))
        .returning();

      const [movie] = await db.select().from(movies).where(eq(movies.id, movieId)).limit(1);

      return reply.send({
        success: true,
        data: {
          ...updated!,
          startedAt: updated!.startedAt.toISOString(),
          finishedAt: updated!.finishedAt?.toISOString() ?? null,
          createdAt: updated!.createdAt.toISOString(),
          updatedAt: updated!.updatedAt.toISOString(),
          deletedAt: updated!.deletedAt?.toISOString() ?? null,
          positionSeconds: updated!.userRating ? 0 : null,
          movie: movie ? toCatalogItem(movie) : undefined,
        },
      });
    }
  );

  // DELETE /api/v1/viewings/:movieId - Soft delete visualização
  typedApp.delete<{ 
    Params: { movieId: string }
  }>(
    '/:movieId',
    { 
      schema: { 
        params: z.object({ movieId: z.string().uuid() }),
      },
      preHandler: [app.authMiddleware],
    },
    async (request, reply) => {
      const { movieId } = request.params;
      const userId = request.user!.id;

      const [updated] = await db
        .update(viewings)
        .set({ 
          deletedAt: new Date(), 
          updatedAt: new Date(), 
          version: sql`${viewings.version} + 1` 
        })
        .where(and(eq(viewings.userId, userId), eq(viewings.movieId, movieId)))
        .returning();

      if (!updated) {
        return reply.status(404).send({
          success: false,
          error: { code: 'VIEWING_NOT_FOUND', message: 'Viewing record not found', permanent: true },
        });
      }

      return reply.send({ success: true, data: { message: 'Viewing removed' } });
    }
  );
}