import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';

import { getStoredToken, getMe, clearToken } from '@/services/api';

// ============================================
// AUTH CONTEXT
// ============================================

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    try {
      const storedToken = await getStoredToken();
      if (!storedToken) {
        setToken(null);
        setUser(null);
        return;
      }
      const userInfo = await getMe(storedToken);
      setToken(storedToken);
      setUser(userInfo);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (email: string, password: string) => {
    const { accessToken, user: userInfo } = await import('@/services/api').then((m) =>
      m.login({ email, password }),
    );
    setToken(accessToken);
    setUser(userInfo);
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  );
}