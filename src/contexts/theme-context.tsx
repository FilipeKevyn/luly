import Storage from 'expo-sqlite/kv-store';
import * as SystemUI from 'expo-system-ui';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { Appearance, Platform } from 'react-native';

import { Palettes, type ThemePalette, type ThemeScheme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const THEME_MODES = ['light', 'dark', 'system'] as const;

export type ThemeMode = (typeof THEME_MODES)[number];

interface ThemeContextValue {
  /** User preference: light, dark or follow the device. */
  mode: ThemeMode;
  /** Resolved scheme currently applied to the UI. */
  scheme: ThemeScheme;
  palette: ThemePalette;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const THEME_STORAGE_KEY = 'luly.theme-mode';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function AppThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const userChangedMode = useRef(false);

  useEffect(() => {
    let active = true;

    Storage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        if (active && !userChangedMode.current && isThemeMode(stored)) {
          setModeState(stored);
        }
      })
      .catch(() => {
        // A storage failure should never block the app; fall back to system.
      });

    return () => {
      active = false;
    };
  }, []);

  const scheme: ThemeScheme =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
  const palette = Palettes[scheme];
  const isDark = scheme === 'dark';

  const setMode = useCallback((nextMode: ThemeMode) => {
    userChangedMode.current = true;
    setModeState(nextMode);
    Storage.setItem(THEME_STORAGE_KEY, nextMode).catch(() => {
      // Keep the in-memory preference even if persistence is unavailable.
    });
  }, []);

  const toggle = useCallback(() => {
    setMode(isDark ? 'light' : 'dark');
  }, [isDark, setMode]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (typeof document === 'undefined') {
        return;
      }
      document.documentElement.style.backgroundColor = palette.background;
      document.documentElement.style.colorScheme = scheme;
      document.body.style.backgroundColor = palette.background;
      return;
    }
    // Keep native UI (alerts, keyboard, system controls) in sync with the
    // preference chosen in the app.
    Appearance.setColorScheme(mode === 'system' ? 'unspecified' : mode);
    SystemUI.setBackgroundColorAsync(palette.background).catch(() => {
      // expo-system-ui is optional for the theme itself.
    });
  }, [mode, palette.background, scheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, scheme, palette, isDark, setMode, toggle }),
    [isDark, mode, palette, scheme, setMode, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeController(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeController must be used inside <AppThemeProvider>.');
  }
  return context;
}

export function useTheme(): ThemePalette {
  return useThemeController().palette;
}

/**
 * Builds a StyleSheet from the active palette and rebuilds it when the theme
 * changes. Pass a module-level factory so the hook can memoize correctly.
 */
export function useThemedStyles<T>(createStyles: (palette: ThemePalette) => T): T {
  const palette = useTheme();
  return useMemo(() => createStyles(palette), [createStyles, palette]);
}
