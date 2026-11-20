import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  real,
  timestamp,
  boolean,
  pgEnum,
  index,
  uniqueIndex,
  primaryKey,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// ENUMS
// ============================================

export const syncOperationTypeEnum = pgEnum('sync_operation_type', [
  'create_list',
  'delete_list',
  'add_list_item',
  'remove_list_item',
  'start_viewing',
  'update_viewing',
  'delete_viewing',
]);

export const syncOperationStatusEnum = pgEnum('sync_operation_status', [
  'pending',
  'sending',
  'synced',
  'conflict',
  'error_permanent',
  'error_transient',
]);

// ============================================
// TABLES
// ============================================

// Users
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
  })
);

// Movies (catálogo próprio, cadastro manual)
export const movies = pgTable(
  'movies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 500 }).notNull(),
    originalTitle: varchar('original_title', { length: 500 }),
    overview: text('overview'),
    releaseYear: integer('release_year'),
    runtimeMin: integer('runtime_min'),
    rating: real('rating'),
    posterUrl: text('poster_url'),
    backdropUrl: text('backdrop_url'),
    genres: text('genres').array(),
    driveFileId: varchar('drive_file_id', { length: 100 }).unique(),
    driveUrl: text('drive_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => ({
    driveFileIdIdx: uniqueIndex('movies_drive_file_id_idx').on(table.driveFileId),
    titleSearchIdx: index('movies_title_search_idx').on(table.title),
    releaseYearIdx: index('movies_release_year_idx').on(table.releaseYear),
  })
);

// Lists
export const lists = pgTable(
  'lists',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => ({
    userIdx: index('lists_user_idx').on(table.userId),
    userNameUnique: uniqueIndex('lists_user_name_unique_idx').on(table.userId, table.name),
  })
);

// List Items
export const listItems = pgTable(
  'list_items',
  {
    listId: uuid('list_id')
      .notNull()
      .references(() => lists.id, { onDelete: 'cascade' }),
    movieId: uuid('movie_id')
      .notNull()
      .references(() => movies.id, { onDelete: 'cascade' }),
    addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.listId, table.movieId] }),
    movieIdx: index('list_items_movie_idx').on(table.movieId),
  })
);

// Viewings (History + Ratings)
export const viewings = pgTable(
  'viewings',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    movieId: uuid('movie_id')
      .notNull()
      .references(() => movies.id, { onDelete: 'cascade' }),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    userRating: real('user_rating'),
    version: integer('version').default(1).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.movieId] }),
    movieIdx: index('viewings_movie_idx').on(table.movieId),
    userIdx: index('viewings_user_idx').on(table.userId),
  })
);

// Sync State (cursor por usuário para pull)
export const syncState = pgTable(
  'sync_state',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' })
      .primaryKey(),
    cursor: varchar('cursor', { length: 255 }).notNull(), // UUID da última operação processada
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  }
);

// Outbox (operações pendentes de envio ao servidor - para referência, mas mobile tem sua própria)
// Nota: Esta tabela é para debug/auditoria no backend; o mobile mantém sua outbox local no SQLite
export const outbox = pgTable(
  'outbox',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    operationId: varchar('operation_id', { length: 36 }).notNull().unique(),
    type: syncOperationTypeEnum('type').notNull(),
    payload: jsonb('payload').notNull(),
    status: syncOperationStatusEnum('status').default('pending').notNull(),
    attempts: integer('attempts').default(0).notNull(),
    lastError: text('last_error'),
    baseRevision: integer('base_revision'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
  },
  (table) => ({
    userIdx: index('outbox_user_idx').on(table.userId),
    statusIdx: index('outbox_status_idx').on(table.status),
    operationIdIdx: uniqueIndex('outbox_operation_id_idx').on(table.operationId),
  })
);

// Refresh Token Blocklist (para logout/revogação)
export const refreshTokenBlocklist = pgTable(
  'refresh_token_blocklist',
  {
    tokenHash: varchar('token_hash', { length: 64 }).primaryKey(), // SHA-256 hex
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('refresh_token_blocklist_user_idx').on(table.userId),
    expiresIdx: index('refresh_token_blocklist_expires_idx').on(table.expiresAt),
  })
);

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ many }) => ({
  lists: many(lists),
  viewings: many(viewings),
  syncState: many(syncState),
  outbox: many(outbox),
  blocklist: many(refreshTokenBlocklist),
}));

export const moviesRelations = relations(movies, ({ many }) => ({
  listItems: many(listItems),
  viewings: many(viewings),
}));

export const listsRelations = relations(lists, ({ one, many }) => ({
  user: one(users, { fields: [lists.userId], references: [users.id] }),
  items: many(listItems),
}));

export const listItemsRelations = relations(listItems, ({ one }) => ({
  list: one(lists, { fields: [listItems.listId], references: [lists.id] }),
  movie: one(movies, { fields: [listItems.movieId], references: [movies.id] }),
}));

export const viewingsRelations = relations(viewings, ({ one }) => ({
  user: one(users, { fields: [viewings.userId], references: [users.id] }),
  movie: one(movies, { fields: [viewings.movieId], references: [movies.id] }),
}));

export const syncStateRelations = relations(syncState, ({ one }) => ({
  user: one(users, { fields: [syncState.userId], references: [users.id] }),
}));

export const outboxRelations = relations(outbox, ({ one }) => ({
  user: one(users, { fields: [outbox.userId], references: [users.id] }),
}));

export const refreshTokenBlocklistRelations = relations(refreshTokenBlocklist, ({ one }) => ({
  user: one(users, { fields: [refreshTokenBlocklist.userId], references: [users.id] }),
}));

// ============================================
// TYPES (inferidos do schema)
// ============================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Movie = typeof movies.$inferSelect;
export type NewMovie = typeof movies.$inferInsert;

export type List = typeof lists.$inferSelect;
export type NewList = typeof lists.$inferInsert;

export type ListItem = typeof listItems.$inferSelect;
export type NewListItem = typeof listItems.$inferInsert;

export type Viewing = typeof viewings.$inferSelect;
export type NewViewing = typeof viewings.$inferInsert;

export type SyncState = typeof syncState.$inferSelect;
export type NewSyncState = typeof syncState.$inferInsert;

export type Outbox = typeof outbox.$inferSelect;
export type NewOutbox = typeof outbox.$inferInsert;

export type RefreshTokenBlocklist = typeof refreshTokenBlocklist.$inferSelect;
export type NewRefreshTokenBlocklist = typeof refreshTokenBlocklist.$inferInsert;