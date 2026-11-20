-- Catálogo próprio de filmes (remove vínculo com TMDB)
-- Aplicar manualmente: ver drizzle/meta/_journal.json (somente 0000 está versionado).

ALTER TABLE "movies" ADD COLUMN IF NOT EXISTS "release_year" integer;
ALTER TABLE "movies" ADD COLUMN IF NOT EXISTS "rating" real;
ALTER TABLE "movies" ADD COLUMN IF NOT EXISTS "poster_url" text;
ALTER TABLE "movies" ADD COLUMN IF NOT EXISTS "backdrop_url" text;
ALTER TABLE "movies" ADD COLUMN IF NOT EXISTS "genres" text[];

UPDATE "movies"
SET "release_year" = EXTRACT(YEAR FROM "release_date")::int
WHERE "release_year" IS NULL AND "release_date" IS NOT NULL;

UPDATE "movies"
SET "rating" = "vote_average"
WHERE "rating" IS NULL AND "vote_average" IS NOT NULL;

ALTER TABLE "movies" DROP COLUMN IF EXISTS "tmdb_id";
ALTER TABLE "movies" DROP COLUMN IF EXISTS "release_date";
ALTER TABLE "movies" DROP COLUMN IF EXISTS "vote_average";
ALTER TABLE "movies" DROP COLUMN IF EXISTS "vote_count";
ALTER TABLE "movies" DROP COLUMN IF EXISTS "poster_path";
ALTER TABLE "movies" DROP COLUMN IF EXISTS "backdrop_path";
ALTER TABLE "movies" DROP COLUMN IF EXISTS "genre_ids";

DROP INDEX IF EXISTS "movies_tmdb_id_idx";

CREATE INDEX IF NOT EXISTS "movies_release_year_idx" ON "movies" ("release_year");
