/**
 * Theme hook re-exported from the global provider.
 *
 * Screens and components should prefer reading colors through this hook (or
 * `useThemedStyles`) so light/dark switching stays reactive.
 */

export { useTheme } from '@/contexts/theme-context';
