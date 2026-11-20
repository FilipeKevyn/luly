import { z } from 'zod';

import type { movies } from '@/db/schema';

// ============================================
// CATALOG CONTRACT (para o app mobile)
// ============================================

export interface MovieCatalogItem {
  id: string; // UUID gerado pelo banco
  title: string;
  originalTitle: string | null;
  overview: string | null;
  releaseYear: number | null;
  runtimeMin: number | null;
  rating: number | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  genres: string[];
  hasDriveLink: boolean;
}

type MovieRow = typeof movies.$inferSelect;

export function toCatalogItem(movie: MovieRow): MovieCatalogItem {
  return {
    id: movie.id,
    title: movie.title,
    originalTitle: movie.originalTitle,
    overview: movie.overview,
    releaseYear: movie.releaseYear,
    runtimeMin: movie.runtimeMin,
    rating: movie.rating,
    posterUrl: movie.posterUrl,
    backdropUrl: movie.backdropUrl,
    genres: movie.genres ?? [],
    hasDriveLink: !!movie.driveFileId,
  };
}

// ============================================
// CADASTRO MANUAL
// ============================================

export const createMovieBodySchema = z.object({
  title: z.string().min(1).max(500),
  originalTitle: z.string().max(500).nullable().optional(),
  overview: z.string().nullable().optional(),
  releaseYear: z.number().int().min(1888).max(2200).nullable().optional(),
  runtimeMin: z.number().int().positive().nullable().optional(),
  rating: z.number().min(0).max(10).nullable().optional(),
  posterUrl: z.string().url().nullable().optional(),
  backdropUrl: z.string().url().nullable().optional(),
  genres: z.array(z.string().min(1)).optional(),
  /** Link do Google Drive (opcional, habilita o player). */
  driveUrl: z.string().url().nullable().optional(),
});

export type CreateMovieBody = z.infer<typeof createMovieBodySchema>;

export const updateMovieBodySchema = createMovieBodySchema.partial();

export type UpdateMovieBody = z.infer<typeof updateMovieBodySchema>;
