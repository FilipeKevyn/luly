import AsyncStorage from 'expo-sqlite/kv-store';

import { env } from '@/config';

// ============================================
// API CLIENT
// ============================================

const API_BASES = env.EXPO_PUBLIC_API_URLS;
const TOKEN_KEY = 'luly.access_token';
const REQUEST_TIMEOUT_MS = 15000;

let activeBase: string | null = null;

class ApiNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiNetworkError';
  }
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    permanent: boolean;
  };
}

export interface ApiResult<T> {
  success: true;
  data: T;
}

type ApiEnvelope<T> = ApiResult<T> | ApiError;

function basesToTry(): string[] {
  if (!activeBase) {
    return API_BASES;
  }
  return [activeBase, ...API_BASES.filter((base) => base !== activeBase)];
}

export async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const bases = basesToTry();
  const reasons: string[] = [];

  for (const base of bases) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${base}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      activeBase = base;

      const envelope = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

      if (!envelope || !envelope.success) {
        const err = envelope as ApiError | null;
        throw new Error(err?.error?.message ?? `HTTP ${response.status}`);
      }

      return (envelope as ApiResult<T>).data;
    } catch (error) {
      if (error instanceof ApiNetworkError) {
        reasons.push(error.message);
        continue;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        reasons.push(`${base} (tempo esgotado após ${REQUEST_TIMEOUT_MS / 1000}s)`);
        continue;
      }

      if (error instanceof TypeError) {
        // Falha de rede do fetch (servidor fora do ar / host inacessível).
        reasons.push(`${base} (${error.message})`);
        continue;
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  activeBase = null;
  throw new ApiNetworkError(
    `Não foi possível conectar à API. Tentativas: ${reasons.join('; ')}. ` +
      'Confira se o backend está rodando (`npm run dev` em backend/) e se o celular está na mesma rede do computador.',
  );
}

// ============================================
// TOKEN PERSISTENCE
// ============================================

export async function saveToken(token: string): Promise<void> {
  await AsyncStorage.setItemAsync(TOKEN_KEY, token);
}

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItemAsync(TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItemAsync(TOKEN_KEY);
}

// ============================================
// AUTH
// ============================================

interface LoginData {
  email: string;
  password: string;
}

interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export async function login(data: LoginData): Promise<AuthResult> {
  const result = await request<AuthResult>('POST', '/auth/login', data);
  await saveToken(result.accessToken);
  return result;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export async function register(data: RegisterData): Promise<AuthResult> {
  const result = await request<AuthResult>('POST', '/auth/register', data);
  await saveToken(result.accessToken);
  return result;
}

export async function logout(refreshToken?: string): Promise<void> {
  const token = await getStoredToken();
  await request('POST', '/auth/logout', { refreshToken }, token);
  await clearToken();
}

export async function getMe(token: string): Promise<AuthResult['user']> {
  return request('GET', '/auth/me', undefined, token);
}

// ============================================
// MOVIES
// ============================================

export interface MovieCatalogItem {
  id: string;
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
  driveUrl?: string | null;
}

interface MoviesListData {
  items: MovieCatalogItem[];
  page: number;
  totalPages: number;
  totalItems: number;
  cursor: string | null;
}

export async function fetchMovies(
  page = 1,
  limit = 20,
  query?: string,
  token?: string | null,
  genre?: string,
): Promise<MoviesListData> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sort: 'recent',
  });
  if (query) params.set('q', query);
  if (genre) params.set('genre', genre);
  return request<MoviesListData>(
    'GET',
    `/movies?${params.toString()}`,
    undefined,
    token,
  );
}

export async function fetchMovieById(
  id: string,
  token?: string | null,
): Promise<MovieCatalogItem> {
  return request('GET', `/movies/${id}`, undefined, token);
}

interface GenresData {
  genres: string[];
}

export async function fetchGenres(token?: string | null): Promise<string[]> {
  const result = await request<GenresData>('GET', '/movies/genres', undefined, token);
  return result.genres;
}
