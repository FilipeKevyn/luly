import { useCallback, useEffect, useState } from 'react';

import { fetchMovies } from '@/services/api';
import { toMovie } from '@/services/adapter';
import type { Movie } from '@/data/movies';

interface UseMoviesResult {
  movies: Movie[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  page: number;
  totalPages: number;
  totalItems: number;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  search: (query: string) => void;
}

export function useMovies(token: string | null, genre?: string): UseMoviesResult {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [query, setQuery] = useState('');

  const executeFetch = useCallback(
    async (targetPage: number, searchQuery: string, isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else if (targetPage === 1) {
          setLoading(true);
        }
        setError(null);

        const result = await fetchMovies(
          targetPage,
          20,
          searchQuery || undefined,
          token,
          genre,
        );
        const mapped = result.items.map(toMovie);

        if (targetPage === 1 || isRefresh) {
          setMovies(mapped);
        } else {
          setMovies((prev) => [...prev, ...mapped]);
        }
        setPage(targetPage);
        setTotalPages(result.totalPages);
        setTotalItems(result.totalItems);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar filmes');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, genre],
  );

  useEffect(() => {
    void executeFetch(1, query);
  }, [query, genre, executeFetch]);

  const loadMore = useCallback(() => {
    if (page < totalPages && !loading) {
      void executeFetch(page + 1, query);
    }
  }, [page, totalPages, loading, query, executeFetch]);

  const refresh = useCallback(() => {
    void executeFetch(1, query, true);
  }, [query, executeFetch]);

  const search = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
  }, []);

  return {
    movies,
    loading,
    error,
    refreshing,
    page,
    totalPages,
    totalItems,
    hasMore: page < totalPages,
    loadMore,
    refresh,
    search,
  };
}