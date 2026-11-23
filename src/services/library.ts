import type { Movie } from '@/data/movies';
import { salvarFilme } from '@/db/repositories';
import { toMovie } from '@/services/adapter';
import { fetchMovieById } from '@/services/api';

/**
 * Atualiza os snapshots locais de filmes salvos com os dados mais recentes da
 * API. Isso evita que capas/gêneros antigos continuem aparecendo nas listas
 * depois que o catálogo do backend é corrigido.
 */
export async function refreshMovieSnapshots(
  movies: readonly Movie[],
  token?: string | null,
): Promise<Movie[]> {
  return Promise.all(
    movies.map(async (movie) => {
      try {
        const item = await fetchMovieById(movie.id, token);
        const fresh = toMovie(item);
        await salvarFilme(fresh);
        return fresh;
      } catch {
        return movie;
      }
    }),
  );
}
