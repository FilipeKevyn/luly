/**
 * Design tokens used across the app.
 *
 * `Brand` keeps the colors that never change between themes (accent red,
 * highlight yellow, media black). Everything else must come from `useTheme()`
 * so the UI can switch between the light and dark palettes at runtime.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Brand = {
  red: '#E81E3A',
  redPressed: '#C9162F',
  yellow: '#FFD60A',
  black: '#000000',
  white: '#FFFFFF',
  success: '#A9F5C7',
} as const;

export type ThemeScheme = 'light' | 'dark';

export interface ThemePalette {
  /** Primary text color. */
  text: string;
  /** Secondary text color. */
  textMuted: string;
  /** Long-form body text (slightly softer than the primary text). */
  textBody: string;
  /** Legacy alias kept for the starter themed components. */
  textSecondary: string;
  /** Screen background. */
  background: string;
  /** Slightly different screen background (e.g. details/empty states). */
  backgroundMuted: string;
  /** Legacy alias kept for the starter themed components. */
  backgroundElement: string;
  /** Legacy alias kept for the starter themed components. */
  backgroundSelected: string;
  /** Cards, sheets, inputs and raised surfaces. */
  surface: string;
  /** Secondary surfaces (disabled chips, image placeholders). */
  surfaceMuted: string;
  /** Thick, high-contrast borders. */
  border: string;
  /** Thin dividers and subtle outlines. */
  borderSubtle: string;
  /** Hard-shadow color. */
  shadow: string;
  accent: string;
  accentPressed: string;
  highlight: string;
  /** Content placed on top of the accent color. */
  onAccent: string;
  /** Video/poster backdrop. */
  mediaBackground: string;
  /** Content placed on top of images or video. */
  onMedia: string;
  /** Secondary content placed on top of images or video. */
  onMediaMuted: string;
  /** Modal/sheet backdrop. */
  backdrop: string;
  /** Bottom tab bar background. */
  tabBar: string;
  /** Positive badge background. */
  success: string;
}

const light: ThemePalette = {
  text: '#111114',
  textMuted: '#6E6E73',
  textBody: '#3A3A3D',
  textSecondary: '#60646C',
  background: '#FFFFFF',
  backgroundMuted: '#F2F2F2',
  backgroundElement: '#F0F0F3',
  backgroundSelected: '#E0E1E6',
  surface: '#FFFFFF',
  surfaceMuted: '#F2F2F2',
  border: '#000000',
  borderSubtle: '#E4E4E7',
  shadow: '#000000',
  accent: Brand.red,
  accentPressed: Brand.redPressed,
  highlight: Brand.yellow,
  onAccent: Brand.white,
  mediaBackground: Brand.black,
  onMedia: Brand.white,
  onMediaMuted: 'rgba(255, 255, 255, 0.7)',
  backdrop: 'rgba(0, 0, 0, 0.55)',
  tabBar: '#FFFFFF',
  success: Brand.success,
};

const dark: ThemePalette = {
  text: '#F5F5F7',
  textMuted: '#A1A1AA',
  textBody: '#D4D4D8',
  textSecondary: '#B0B4BA',
  background: '#0A0A0C',
  backgroundMuted: '#0A0A0C',
  backgroundElement: '#212225',
  backgroundSelected: '#2E3135',
  surface: '#1B1B1F',
  surfaceMuted: '#26262B',
  border: '#3F3F46',
  borderSubtle: '#2C2C31',
  shadow: '#000000',
  accent: Brand.red,
  accentPressed: Brand.redPressed,
  highlight: Brand.yellow,
  onAccent: Brand.white,
  mediaBackground: Brand.black,
  onMedia: Brand.white,
  onMediaMuted: 'rgba(255, 255, 255, 0.72)',
  backdrop: 'rgba(0, 0, 0, 0.65)',
  tabBar: '#121216',
  success: Brand.success,
};

export const Palettes = { light, dark } as const satisfies Record<ThemeScheme, ThemePalette>;

/** Backwards-compatible alias used by the starter themed components. */
export const Colors = Palettes;

export type ThemeColor = keyof ThemePalette;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
