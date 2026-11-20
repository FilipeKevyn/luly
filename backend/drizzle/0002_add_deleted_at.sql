-- Add deleted_at column to movies table
ALTER TABLE "movies" ADD COLUMN "deleted_at" timestamp with time zone;

-- Add deleted_at column to users table  
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp with time zone;

-- Add deleted_at column to lists table (should already exist)
ALTER TABLE "lists" ADD COLUMN "deleted_at" timestamp with time zone;

-- Add deleted_at column to viewings table (should already exist)
ALTER TABLE "viewings" ADD COLUMN "deleted_at" timestamp with time zone;