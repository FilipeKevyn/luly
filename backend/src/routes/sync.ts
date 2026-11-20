import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { db } from '@/db/client';
import { lists, listItems, viewings, syncState, outbox } from '@/db/schema';
import { eq, and, desc, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';

export async function syncRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  
  // POST /api/v1/sync/push - Enviar uma operação
  typedApp.post<{ 
    Body: {
      clientToken: string;
      changes: {
        entity: 'list' | 'listItem' | 'viewing';
        id: string;
        op: 'upsert' | 'delete';
        version?: number;
        data?: Record<string, unknown>;
      }[];
    }
  }>(
    '/push',
    { 
      schema: { 
        body: z.object({
          clientToken: z.string().min(1),
          changes: z.array(z.object({
            entity: z.enum(['list', 'listItem', 'viewing']),
            id: z.string().uuid(),
            op: z.enum(['upsert', 'delete']),
            version: z.number().int().optional(),
            data: z.record(z.unknown()).optional(),
          })).min(1),
        }),
      },
      preHandler: [app.authMiddleware],
    },
    async (request, reply) => {
      const { clientToken, changes } = request.body;
      const userId = request.user!.id;

      // Idempotency: check if operation was already processed
      const [existingOutbox] = await db
        .select()
        .from(outbox)
        .where(eq(outbox.operationId, clientToken))
        .limit(1);

      if (existingOutbox) {
        if (existingOutbox.status === 'synced') {
          return reply.send({
            success: true,
            result: {
              id: clientToken,
              revision: existingOutbox.baseRevision || 1,
              serverTimestamp: existingOutbox.processedAt?.toISOString() || new Date().toISOString(),
            },
          });
        }
        if (existingOutbox.status === 'sending') {
          return reply.status(409).send({
            success: false,
            error: { code: 'OPERATION_IN_PROGRESS', message: 'Operation is being processed', permanent: false },
          });
        }
        // If conflict or error, allow retry by updating status
      }

      // Record in outbox (audit trail)
      await db
        .insert(outbox)
        .values({
          userId,
          operationId: clientToken,
          type: 'create_list', // Placeholder
          payload: { changes } as any,
          status: 'sending',
          baseRevision: undefined,
          attempts: (existingOutbox?.attempts ?? 0) + 1,
        })
        .onConflictDoUpdate({
          target: outbox.operationId,
          set: { status: 'sending', attempts: sql`${outbox.attempts} + 1`, lastError: null },
        });

      // Process changes (simplified: process first change)
      const firstChange = changes[0];
      
      try {
        let result: { id: string; revision: number; serverTimestamp: string };

        switch (firstChange.entity) {
          case 'list': {
            if (firstChange.op === 'delete') {
              const listId = firstChange.id;
              const [list] = await db
                .update(lists)
                .set({ deletedAt: new Date(), updatedAt: new Date() })
                .where(and(eq(lists.id, listId), eq(lists.userId, userId)))
                .returning({ id: lists.id, updatedAt: lists.updatedAt });
              if (!list) throw new Error('List not found');
              result = { id: list.id, revision: 1, serverTimestamp: list.updatedAt.toISOString() };
            } else {
              const name = (firstChange.data as { name?: string })?.name || 'New List';
              const [list] = await db
                .insert(lists)
                .values({ userId, name })
                .returning({ id: lists.id, updatedAt: lists.updatedAt });
              result = { id: list.id, revision: 1, serverTimestamp: list.updatedAt.toISOString() };
            }
            break;
          }

          case 'listItem': {
            if (firstChange.op === 'delete') {
              const [listId, movieId] = firstChange.id.split(':');
              await db.delete(listItems).where(and(eq(listItems.listId, listId), eq(listItems.movieId, movieId)));
              result = { id: firstChange.id, revision: 1, serverTimestamp: new Date().toISOString() };
            } else {
              const data = firstChange.data as { listId: string; movieId: string } | undefined;
              if (!data?.listId || !data?.movieId) throw new Error('Missing listId or movieId');
              
              // Verify list belongs to user
              const list = await db.query.lists.findFirst({
                where: and(eq(lists.id, data.listId), eq(lists.userId, userId), isNull(lists.deletedAt)),
              });
              if (!list) throw new Error('List not found');
              await db.insert(listItems).values({ listId: data.listId, movieId: data.movieId }).onConflictDoNothing();
              result = { id: `${data.listId}:${data.movieId}`, revision: 1, serverTimestamp: new Date().toISOString() };
            }
            break;
          }

          case 'viewing': {
            const movieId = firstChange.id.split(':')[1];
            if (firstChange.op === 'delete') {
              const [updated] = await db
                .update(viewings)
                .set({ 
                  deletedAt: new Date(), 
                  updatedAt: new Date(), 
                  version: sql`${viewings.version} + 1` 
                })
                .where(and(eq(viewings.userId, userId), eq(viewings.movieId, movieId)))
                .returning();
              if (!updated) throw new Error('Viewing not found');
              result = { id: firstChange.id, revision: updated.version, serverTimestamp: updated.updatedAt.toISOString() };
            } else {
              const data = firstChange.data as { movieId: string; finishedAt?: string; userRating?: number | null } | undefined;
              if (!data?.movieId) throw new Error('Missing movieId');
              
              const existing = await db.query.viewings.findFirst({
                where: and(eq(viewings.userId, userId), eq(viewings.movieId, movieId)),
              });

              if (!existing) {
                const [viewing] = await db
                  .insert(viewings)
                  .values({ userId, movieId })
                  .returning({ id: viewings.movieId, version: viewings.version, updatedAt: viewings.updatedAt });
                result = { id: `${userId}:${movieId}`, revision: viewing.version, serverTimestamp: viewing.updatedAt.toISOString() };
              } else {
                // Update existing
                const baseRevision = firstChange.version ?? existing.version;
                if (baseRevision !== existing.version) {
                  await db
                    .update(outbox)
                    .set({ status: 'conflict', lastError: 'Version conflict' })
                    .where(eq(outbox.operationId, clientToken));
                  return reply.status(409).send({
                    success: false,
                    conflict: {
                      serverRevision: existing.version,
                      serverData: {
                        ...existing,
                        startedAt: existing.startedAt.toISOString(),
                        finishedAt: existing.finishedAt?.toISOString() ?? null,
                      },
                      message: 'Viewing was modified by another device',
                    },
                  });
                }

                const updateData: Partial<typeof viewings.$inferSelect> = { 
                  version: existing.version + 1, 
                  updatedAt: new Date() 
                };
                if (data.finishedAt !== undefined) updateData.finishedAt = data.finishedAt ? new Date(data.finishedAt) : null;
                if (data.userRating !== undefined) updateData.userRating = data.userRating;

                const [updated] = await db
                  .update(viewings)
                  .set(updateData)
                  .where(and(eq(viewings.userId, userId), eq(viewings.movieId, data.movieId)))
                  .returning();
                result = { id: `${userId}:${data.movieId}`, revision: updated!.version, serverTimestamp: updated!.updatedAt.toISOString() };
              }
            }
            break;
          }

          default:
            throw new Error(`Unknown operation type: ${firstChange.entity}`);
        }

        // Mark as synced
        await db
          .update(outbox)
          .set({ status: 'synced', processedAt: new Date() })
          .where(eq(outbox.operationId, clientToken));

        return reply.send({ success: true, result });
      } catch (error: any) {
        console.error('Sync push error:', error);

        const isPermanent = error.message.includes('not found') || error.message.includes('foreign key');

        await db
          .update(outbox)
          .set({
            status: isPermanent ? 'error_permanent' : 'error_transient',
            lastError: error.message,
          })
          .where(eq(outbox.operationId, clientToken));

        return reply.status(isPermanent ? 400 : 500).send({
          success: false,
          error: {
            code: isPermanent ? 'VALIDATION_ERROR' : 'TRANSIENT_ERROR',
            message: error.message,
            permanent: isPermanent,
          },
        });
      }
    }
  );

  // GET /api/v1/sync/pull - Pull paginado de alterações
  typedApp.get<{ 
    Querystring: { cursor?: string; limit: number }
  }>(
    '/pull',
    { 
      schema: { 
        querystring: z.object({
          cursor: z.string().optional(),
          limit: z.coerce.number().int().positive().default(50),
        }),
      },
      preHandler: [app.authMiddleware],
    },
    async (request, reply) => {
      const { cursor, limit } = request.query;
      const userId = request.user!.id;

      // Get user's sync state
      let state = await db.query.syncState.findFirst({
        where: eq(syncState.userId, userId),
      });
      if (!state) {
        [state] = await db.insert(syncState).values({ userId, cursor: '0' }).returning();
      }

      void (cursor ?? state.cursor);

      // Fetch operations since cursor
      const operations: {
        entity: string;
        id: string;
        op: string;
        data?: Record<string, unknown>;
      }[] = [];

      // Lists (created/updated/deleted)
      const recentLists = await db.query.lists.findMany({
        where: and(eq(lists.userId, userId), isNull(lists.deletedAt)),
        orderBy: (list) => [desc(list.updatedAt)],
        limit,
      });

      for (const l of recentLists) {
        operations.push({
          entity: 'list',
          id: l.id,
          op: 'upsert',
          data: { name: l.name },
        });
      }

      // List items
      const recentItems = await db.query.listItems.findMany({
        orderBy: (item) => [desc(item.addedAt)],
        limit,
        with: {
          list: true,
        },
      });

      for (const item of recentItems) {
        // Verify list belongs to user
        if (item.list?.userId !== userId) continue;
        operations.push({
          entity: 'listItem',
          id: `${item.listId}:${item.movieId}`,
          op: 'upsert',
          data: { listId: item.listId, movieId: item.movieId },
        });
      }

      // Viewings
      const recentViewings = await db.query.viewings.findMany({
        where: and(eq(viewings.userId, userId), isNull(viewings.deletedAt)),
        orderBy: (v) => [desc(v.updatedAt)],
        limit,
      });

      for (const v of recentViewings) {
        operations.push({
          entity: 'viewing',
          id: `${userId}:${v.movieId}`,
          op: v.finishedAt || v.userRating !== null ? 'update' : 'upsert',
          data: {
            movieId: v.movieId,
            finishedAt: v.finishedAt?.toISOString(),
            userRating: v.userRating,
          },
        });
      }

      // Sort by server timestamp (using updatedAt from entities)
      operations.sort((a, b) => {
        const tsA = a.data?.updatedAt ? new Date(a.data.updatedAt as string).getTime() : Date.now();
        const tsB = b.data?.updatedAt ? new Date(b.data.updatedAt as string).getTime() : Date.now();
        return tsB - tsA;
      });

      const nextToken = operations.length > 0 ? operations[operations.length - 1].id : state.cursor;

      // Update sync state
      await db.update(syncState).set({ cursor: nextToken, updatedAt: new Date() }).where(eq(syncState.userId, userId));

      return reply.send({
        success: true,
        data: {
          token: nextToken,
          changes: operations,
          hasMore: operations.length >= limit,
        },
      });
    }
  );
}