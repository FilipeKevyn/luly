DO $$ BEGIN
 CREATE TYPE "public"."sync_operation_status" AS ENUM('pending', 'sending', 'synced', 'conflict', 'error_permanent', 'error_transient');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."sync_operation_type" AS ENUM('create_list', 'delete_list', 'add_list_item', 'remove_list_item', 'start_viewing', 'update_viewing', 'delete_viewing');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "list_items" (
	"list_id" uuid NOT NULL,
	"movie_id" uuid NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "list_items_list_id_movie_id_pk" PRIMARY KEY("list_id","movie_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "movies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tmdb_id" integer NOT NULL,
	"title" varchar(500) NOT NULL,
	"original_title" varchar(500),
	"overview" text,
	"release_date" timestamp with time zone,
	"runtime_min" integer,
	"vote_average" real,
	"vote_count" integer,
	"poster_path" varchar(500),
	"backdrop_path" varchar(500),
	"genre_ids" integer[],
	"drive_file_id" varchar(100),
	"drive_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "movies_tmdb_id_unique" UNIQUE("tmdb_id"),
	CONSTRAINT "movies_drive_file_id_unique" UNIQUE("drive_file_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"operation_id" varchar(36) NOT NULL,
	"type" "sync_operation_type" NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "sync_operation_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"base_revision" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "outbox_operation_id_unique" UNIQUE("operation_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "refresh_token_blocklist" (
	"token_hash" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sync_state" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"cursor" varchar(255) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "viewings" (
	"user_id" uuid NOT NULL,
	"movie_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"user_rating" real,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "viewings_user_id_movie_id_pk" PRIMARY KEY("user_id","movie_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "list_items" ADD CONSTRAINT "list_items_list_id_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."lists"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "list_items" ADD CONSTRAINT "list_items_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lists" ADD CONSTRAINT "lists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "outbox" ADD CONSTRAINT "outbox_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "refresh_token_blocklist" ADD CONSTRAINT "refresh_token_blocklist_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sync_state" ADD CONSTRAINT "sync_state_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "viewings" ADD CONSTRAINT "viewings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "viewings" ADD CONSTRAINT "viewings_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "list_items_movie_idx" ON "list_items" USING btree ("movie_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lists_user_idx" ON "lists" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "lists_user_name_unique_idx" ON "lists" USING btree ("user_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "movies_tmdb_id_idx" ON "movies" USING btree ("tmdb_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "movies_drive_file_id_idx" ON "movies" USING btree ("drive_file_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "movies_title_search_idx" ON "movies" (lower("title"));--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outbox_user_idx" ON "outbox" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outbox_status_idx" ON "outbox" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "outbox_operation_id_idx" ON "outbox" USING btree ("operation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "refresh_token_blocklist_user_idx" ON "refresh_token_blocklist" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "refresh_token_blocklist_expires_idx" ON "refresh_token_blocklist" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "viewings_movie_idx" ON "viewings" USING btree ("movie_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "viewings_user_idx" ON "viewings" USING btree ("user_id");