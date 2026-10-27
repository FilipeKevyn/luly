import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme, useThemeController } from '@/contexts/theme-context';

export type ThemeToggleVariant = 'default' | 'onBrand' | 'onMedia';

interface ThemeToggleProps {
  /**
   * `default` uses the current surface, `onBrand` is for the red entry screen
   * and `onMedia` is for headers placed over posters and video.
   */
  variant?: ThemeToggleVariant;
  style?: StyleProp<ViewStyle>;
}

export function ThemeToggle({ variant = 'default', style }: ThemeToggleProps) {
  const theme = useTheme();
  const { isDark, toggle } = useThemeController();

  const isOverlay = variant !== 'default';
  const backgroundColor =
    variant === 'onBrand' ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.45)';
  const borderColor =
    variant === 'onBrand' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.35)';

  return (
    <Pressable
      onPress={toggle}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      accessibilityState={{ selected: isDark }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isOverlay ? backgroundColor : theme.surface,
          borderColor: isOverlay ? borderColor : theme.border,
        },
        style,
        pressed && styles.pressed,
      ]}>
      <MaterialIcons
        name={isDark ? 'light-mode' : 'dark-mode'}
        size={20}
        color={isOverlay ? theme.onMedia : theme.text}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
