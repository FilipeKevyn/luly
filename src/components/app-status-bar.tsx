import { StatusBar } from 'expo-status-bar';

import { useThemeController } from '@/contexts/theme-context';

/** Status bar that follows the app theme instead of the device theme. */
export function ThemedStatusBar() {
  const { isDark } = useThemeController();

  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}
