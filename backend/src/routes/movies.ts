import type { FastifyInstance, FastifyReply } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { and, asc, count, desc, eq, ilike, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { movies } from '@/db/schema';
import {
  createMovieBodySchema,
  toCatalogItem,
  updateMovieBodySchema,
} from '@/services/catalog';
import { buildDriveDownloadUrl, extractDriveFileId, proxyDriveStream } from '@/services/drive';

const movieSortSchema = z.enum(['recent', 'rating', 'release_year', 'title']).default('recent');

type MovieSort = z.infer<typeof movieSortSchema>;

const SORT_COLUMNS = {
  recent: desc(movies.createdAt),
  rating: desc(movies.rating),
  release_year: desc(movies.releaseYear),
  title: asc(movies.title),
} as const satisfies Record<MovieSort, ReturnType<typeof desc>>;

function resolveDriveUrl(driveUrl: string | null | undefined): string | null {
  if (!driveUrl) {
    return null;
  }
  const fileId = extractDriveFileId(driveUrl);
  return fileId ? buildDriveDownloadUrl(fileId) : null;
}

function resolveDriveFileId(driveUrl: string | null | undefined): string | null {
  if (!driveUrl) {
    return null;
  }
  return extractDriveFileId(driveUrl);
}

function normalizeSearchTerm(term: string): string {
  return term
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function escapeLikePattern(term: string): string {
  return term.replace(/[%_]/g, (ch) => '\\' + ch);
}

const ACCENT_TRANSLATE = "áàâãäéèêëíìîïóòôõöúùûüçñ";
const ACCENT_REPLACEMENT = "aaaaaeeeeiiiiooooouuuucn";

function accentInsensitiveLike(column: ReturnType<typeof sql<string>>): ReturnType<typeof sql> {
  return sql`translate(lower(${column}), ${ACCENT_TRANSLATE}, ${ACCENT_REPLACEMENT})`;
}

function invalidResponse(reply: FastifyReply, code: string, message: string) {
  return reply.status(400).send({
    success: false,
    error: { code, message, permanent: true },
  });
}

export async function movieRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // GET /api/v1/movies - Lista paginada com filtros
  typedApp.get<{
    Querystring: {
      page: number;
      limit: number;
      q?: string;
      genre?: string;
      sort: MovieSort;
    };
  }>(
    '/',
    {
      schema: {
        querystring: z.object({
          page: z.coerce.number().int().positive().default(1),
          limit: z.coerce.number().int().positive().max(50).default(20),
          q: z.string().trim().min(1).optional(),
          genre: z.string().trim().min(1).optional(),
          sort: movieSortSchema,
        }),
        response: {
          200: z.object({
            success: z.literal(true),
            data: z.object({
              items: z.array(z.any()),
              page: z.number(),
              totalPages: z.number(),
              totalItems: z.number(),
              cursor: z.string().nullable(),
            }),
          }),
        },
      },
    },
    async (request) => {
      const { page, limit, q, genre, sort } = request.query;
      const offset = (page - 1) * limit;

      const filters = [isNull(movies.deletedAt)];
      if (q) {
        const term = normalizeSearchTerm(q);
        const pattern = `%${escapeLikePattern(term)}%`;
        const searchColumn = sql<unknown>`concat_ws(' ', ${movies.title}, ${movies.originalTitle}, ${movies.overview}, ${sql`array_to_string(${movies.genres}, ' ')`})`;
        filters.push(
          sql`${accentInsensitiveLike(sql`lower(${searchColumn})`)} ILIKE ${pattern} ESCAPE '\\'`,
        );
      }
      if (genre) {
        const term = normalizeSearchTerm(genre);
        filters.push(
          sql`EXISTS (
            SELECT 1 FROM unnest(${movies.genres}) AS g
            WHERE ${accentInsensitiveLike(sql`g`)} = ${term}
          )`,
        );
      }
      const where = and(...filters);

      const [items, [totals]] = await Promise.all([
        db.select().from(movies).where(where).orderBy(SORT_COLUMNS[sort]).limit(limit).offset(offset),
        db.select({ totalItems: count() }).from(movies).where(where),
      ]);

      const totalItems = totals?.totalItems ?? 0;

      return {
        success: true as const,
        data: {
          items: items.map(toCatalogItem),
          page,
          totalPages: Math.max(1, Math.ceil(totalItems / limit)),
          totalItems,
          cursor: null,
        },
      };
    },
  );

  // GET /api/v1/movies/:id - Detalhe por UUID
  typedApp.get<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
      },
    },
    async (request, reply) => {
      const [movie] = await db.select().from(movies).where(eq(movies.id, request.params.id)).limit(1);

      if (!movie || movie.deletedAt) {
        return reply.status(404).send({
          success: false,
          error: { code: 'MOVIE_NOT_FOUND', message: 'Movie not found', permanent: true },
        });
      }

      return {
        success: true as const,
        data: {
          ...toCatalogItem(movie),
          driveUrl: movie.driveUrl,
        },
      };
    },
  );

  // GET /api/v1/movies/:id/stream - Stream de vídeo do Google Drive
  typedApp.get<{ Params: { id: string } }>(
    '/:id/stream',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
      },
      preHandler: [app.authMiddleware],
    },
    async (request, reply) => {
      const [movie] = await db.select().from(movies).where(eq(movies.id, request.params.id)).limit(1);

      if (!movie || movie.deletedAt) {
        return reply.status(404).send({
          success: false,
          error: { code: 'MOVIE_NOT_FOUND', message: 'Movie not found', permanent: true },
        });
      }

      if (!movie.driveFileId) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NO_DRIVE_LINK',
            message: 'No video link configured for this movie',
            permanent: true,
          },
        });
      }

      try {
        const streamResult = await proxyDriveStream(movie.driveFileId, request.headers.range);

        reply.header('Accept-Ranges', 'bytes');
        reply.header('Content-Type', streamResult.contentType);
        reply.header('Content-Length', String(streamResult.contentLength));
        reply.header('Cache-Control', 'public, max-age=3600');

        if (streamResult.contentRange) {
          reply.header('Content-Range', streamResult.contentRange);
          reply.status(streamResult.statusCode);
        }

        return reply.send(streamResult.stream);
      } catch (error) {
        console.error('Drive stream error:', error);
        return reply.status(502).send({
          success: false,
          error: {
            code: 'DRIVE_STREAM_ERROR',
            message: 'Failed to stream video from Drive',
            permanent: false,
          },
        });
      }
    },
  );

  // POST /api/v1/movies/admin - Cadastro manual de filme
  typedApp.post<{ Body: z.infer<typeof createMovieBodySchema> }>(
    '/admin',
    {
      schema: { body: createMovieBodySchema },
      preHandler: [app.authMiddleware],
    },
    async (request, reply) => {
      const { driveUrl, ...rest } = request.body;

      if (driveUrl && !resolveDriveFileId(driveUrl)) {
        return invalidResponse(reply, 'INVALID_DRIVE_URL', 'Invalid Google Drive URL');
      }

      const [created] = await db
        .insert(movies)
        .values({
          ...rest,
          genres: rest.genres ?? [],
          driveFileId: resolveDriveFileId(driveUrl),
          driveUrl: resolveDriveUrl(driveUrl),
        })
        .returning();

      return reply.status(201).send({ success: true as const, data: toCatalogItem(created!) });
    },
  );

  // PATCH /api/v1/movies/admin/:id - Atualiza dados do filme
  typedApp.patch<{ Params: { id: string }; Body: z.infer<typeof updateMovieBodySchema> }>(
    '/admin/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: updateMovieBodySchema,
      },
      preHandler: [app.authMiddleware],
    },
    async (request, reply) => {
      const { driveUrl, ...rest } = request.body;

      if (driveUrl && !resolveDriveFileId(driveUrl)) {
        return invalidResponse(reply, 'INVALID_DRIVE_URL', 'Invalid Google Drive URL');
      }

      const [updated] = await db
        .update(movies)
        .set({
          ...rest,
          ...(driveUrl !== undefined
            ? {
                driveFileId: resolveDriveFileId(driveUrl),
                driveUrl: resolveDriveUrl(driveUrl),
              }
            : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(movies.id, request.params.id), isNull(movies.deletedAt)))
        .returning();

      if (!updated) {
        return reply.status(404).send({
          success: false,
          error: { code: 'MOVIE_NOT_FOUND', message: 'Movie not found', permanent: true },
        });
      }

      return { success: true as const, data: toCatalogItem(updated) };
    },
  );

  // PATCH /api/v1/movies/admin/:id/drive-link - Define o link do Google Drive
  typedApp.patch<{ Params: { id: string }; Body: { driveUrl: string } }>(
    '/admin/:id/drive-link',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: z.object({ driveUrl: z.string().url() }),
      },
      preHandler: [app.authMiddleware],
    },
    async (request, reply) => {
      const fileId = resolveDriveFileId(request.body.driveUrl);
      if (!fileId) {
        return invalidResponse(reply, 'INVALID_DRIVE_URL', 'Invalid Google Drive URL');
      }

      const [updated] = await db
        .update(movies)
        .set({
          driveFileId: fileId,
          driveUrl: buildDriveDownloadUrl(fileId),
          updatedAt: new Date(),
        })
        .where(eq(movies.id, request.params.id))
        .returning();

      if (!updated) {
        return reply.status(404).send({
          success: false,
          error: { code: 'MOVIE_NOT_FOUND', message: 'Movie not found', permanent: true },
        });
      }

      return { success: true as const, data: toCatalogItem(updated) };
    },
  );
}
