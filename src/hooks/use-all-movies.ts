import { useCallback, useEffect, useState } from 'react';

import type { Movie } from '@/data/movies';
import { toMovie } from '@/services/adapter';
import { fetchMovies } from '@/services/api';

const PAGE_SIZE = 50;

interface UseAllMoviesResult {
  movies: Movie[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  refresh: () => void;
}

/**
 * Carrega o catálogo inteiro (todas as páginas) para montar as seções por
 * gênero da tela inicial sem depender de uma lista fixa de gêneros.
 */
export function useAllMovies(token: string | null): UseAllMoviesResult {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const executeFetch = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const firstPage = await fetchMovies(1, PAGE_SIZE, undefined, token);
        const items = [...firstPage.items];

        for (let page = 2; page <= firstPage.totalPages; page += 1) {
          const nextPage = await fetchMovies(page, PAGE_SIZE, undefined, token);
          items.push(...nextPage.items);
        }

        setMovies(items.map(toMovie));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar filmes');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void executeFetch();
  }, [executeFetch]);

  const refresh = useCallback(() => {
    void executeFetch(true);
  }, [executeFetch]);

  return { movies, loading, error, refreshing, refresh };
}
