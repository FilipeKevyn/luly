import type { CastMember, Movie } from '@/data/movies';
import type { MovieCatalogItem } from '@/services/api';

// ============================================
// ADAPTER: backend MovieCatalogItem → mobile Movie
// ============================================

const FALLBACK_GENRE = 'Outro';
const FALLBACK_DURATION_MIN = 120;

function mapGenres(genres: string[]): string[] {
  const cleaned = genres.map((genre) => genre.trim()).filter((genre) => genre.length > 0);
  return cleaned.length > 0 ? cleaned : [FALLBACK_GENRE];
}

function mapMaturity(rating: number | null): string {
  if (rating == null) return 'L';
  if (rating >= 8) return '16';
  if (rating >= 7) return '12';
  if (rating >= 5) return '10';
  return 'L';
}

function estimateMatchPercent(rating: number | null): number {
  if (rating == null) return 50;
  return Math.min(100, Math.max(0, Math.round(rating * 10)));
}

function estimateDuration(runtimeMin: number | null): number {
  return runtimeMin && runtimeMin > 0 ? runtimeMin : FALLBACK_DURATION_MIN;
}

export function toMovie(item: MovieCatalogItem): Movie {
  const genres = mapGenres(item.genres);
  const rating = item.rating ?? 0;
  const videoUrl = item.driveUrl ?? '';
  // Sem elenco/direção no cadastro manual; a tela mostra apenas o que existir.
  const cast: CastMember[] = [];

  return {
    id: item.id,
    title: item.title,
    tagline: item.overview ? `${item.overview.split('.')[0]}.` : '',
    genre: genres[0] ?? FALLBACK_GENRE,
    genres,
    year: item.releaseYear ?? new Date().getFullYear(),
    durationMin: estimateDuration(item.runtimeMin),
    rating,
    maturity: mapMaturity(item.rating),
    matchPercent: estimateMatchPercent(item.rating),
    synopsis: item.overview ?? '',
    director: 'Direção não informada',
    cast,
    poster: item.posterUrl ?? '',
    hero: item.backdropUrl ?? item.posterUrl ?? '',
    videoUrl,
    isOriginal: item.hasDriveLink,
    isNew: false,
    featured: item.hasDriveLink,
  };
}
