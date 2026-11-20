import { z } from 'zod';

// ============================================
// SHARED TYPES
// ============================================

// Error response schema
export const errorBodySchema = z.object({
  code: z.string(),
  message: z.string(),
  permanent: z.boolean(),
});

// Success wrapper
export const successResponseSchema = <T>(dataSchema: z.ZodType<T>) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

// Error wrapper
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: errorBodySchema,
});

// ============================================
// AUTH SCHEMAS
// ============================================

export const registerBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  name: z.string().min(1).max(100),
});

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshBodySchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutBodySchema = z.object({
  refreshToken: z.string().optional(),
});

// Response schemas
export const authResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
  }),
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const userResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// ============================================
// MOVIE SCHEMAS
// ============================================

export const catalogItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  originalTitle: z.string().nullable(),
  overview: z.string().nullable(),
  releaseYear: z.number().int().nullable(),
  runtimeMin: z.number().int().nullable(),
  rating: z.number().nullable(),
  posterUrl: z.string().url().nullable(),
  backdropUrl: z.string().url().nullable(),
  genres: z.array(z.string()).optional(),
  hasDriveLink: z.boolean(),
});

export const movieDetailSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  originalTitle: z.string().nullable(),
  overview: z.string().nullable(),
  posterUrl: z.string().url().nullable(),
  backdropUrl: z.string().url().nullable(),
  releaseYear: z.number().int().nullable(),
  rating: z.number().nullable(),
  runtimeMin: z.number().int().nullable(),
  genres: z.array(z.string()).optional(),
  driveUrl: z.string().url().nullable(),
  hasDriveLink: z.boolean(),
});

// ============================================
// LIST SCHEMAS
// ============================================

export const listSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
});

export const listsListResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    items: z.array(listSchema),
    cursor: z.string().nullable(),
  }),
});

export const listItemSchema = z.object({
  listId: z.string().uuid(),
  movieId: z.string().uuid(),
  addedAt: z.string().datetime(),
});

export const createListBodySchema = z.object({
  name: z.string().min(1).max(100),
  visibility: z.enum(['private', 'shared']).default('private'),
});

export const renameListBodySchema = z.object({
  name: z.string().min(1).max(100),
});

// ============================================
// VIEWING SCHEMAS
// ============================================

export const viewingSchema = z.object({
  userId: z.string().uuid(),
  movieId: z.string().uuid(),
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().nullable(),
  userRating: z.number().int().min(1).max(100).nullable(),
  positionSeconds: z.number().int().min(0).nullable(),
  version: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
});

export const viewingsListResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    items: z.array(viewingSchema),
    cursor: z.string().nullable(),
  }),
});

export const startViewingBodySchema = z.object({
  movieId: z.string().uuid(),
});

export const updateViewingBodySchema = z.object({
  finishedAt: z.string().datetime().optional(),
  userRating: z.number().int().min(1).max(100).nullable().optional(),
  positionSeconds: z.number().int().min(0).nullable().optional(),
  baseRevision: z.number().int().optional(),
});

export const upsertViewingBodySchema = z.object({
  positionSeconds: z.number().int().min(0),
  completed: z.boolean().default(false),
});

export const upsertViewingResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    movieId: z.string().uuid(),
    positionSeconds: z.number().int(),
    completed: z.boolean(),
    updatedAt: z.string(),
  }),
});

// ============================================
// SYNC SCHEMAS
// ============================================

export const syncOperationTypeSchema = z.enum([
  'create_list',
  'delete_list',
  'add_list_item',
  'remove_list_item',
  'start_viewing',
  'update_viewing',
  'delete_viewing',
]);

export const syncOperationPayloadSchema = z.object({
  entity: z.enum(['list', 'listItem', 'viewing']),
  id: z.string().uuid(),
  op: z.enum(['upsert', 'delete']),
  version: z.number().int().optional(),
  data: z.record(z.unknown()).optional(),
});

export const syncPushBodySchema = z.object({
  clientToken: z.string().min(1),
  changes: z
    .array(
      z.object({
        entity: z.enum(['list', 'listItem', 'viewing']),
        id: z.string().uuid(),
        op: z.enum(['upsert', 'delete']),
        version: z.number().int().optional(),
        data: z.record(z.unknown()).optional(),
      })
    )
    .min(1),
});

export const syncPushResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    results: z
      .array(
        z.object({
          id: z.string().uuid(),
          ok: z.boolean(),
          serverVersion: z.number().int().optional(),
          conflict: z.boolean().default(false),
        })
      )
      .default([]),
    pullToken: z.string(),
  }),
});

export const syncPullQuerySchema = z.object({
  lastToken: z.string().optional(),
});

export const syncPullResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    token: z.string(),
    changes: z.array(
      z.object({
        entity: z.string(),
        id: z.string().uuid(),
        op: z.string(),
        data: z.record(z.unknown()).optional(),
      })
    ).default([]),
    hasMore: z.boolean(),
  }),
});

// ============================================
// UTILITY
// ============================================

export const idParamsSchema = z.object({
  id: z.string().uuid(),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(10),
});