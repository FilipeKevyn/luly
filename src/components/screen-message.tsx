import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTheme, useThemedStyles } from '@/contexts/theme-context';
import type { ThemePalette } from '@/constants/theme';
import { TypeScale } from '@/constants/typography';

interface ScreenMessageProps {
  icon?: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ScreenMessage({
  icon = 'movie',
  title,
  description,
  actionLabel,
  onAction,
}: ScreenMessageProps) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ThemeToggle style={[styles.themeToggle, { top: insets.top + 8 }]} />
      <View style={styles.iconBox}>
        <MaterialIcons name={icon} size={34} color={theme.onAccent} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.buttonLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      gap: 12,
      backgroundColor: theme.backgroundMuted,
    },
    themeToggle: {
      position: 'absolute',
      right: 20,
      zIndex: 1,
    },
    iconBox: {
      width: 72,
      height: 72,
      borderRadius: 20,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.border,
      marginBottom: 4,
    },
    title: {
      ...TypeScale.emptyTitle,
      fontWeight: '900',
      color: theme.text,
      textAlign: 'center',
    },
    description: {
      ...TypeScale.body,
      color: theme.textMuted,
      textAlign: 'center',
    },
    button: {
      marginTop: 8,
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 8,
      backgroundColor: theme.accent,
      borderWidth: 2,
      borderColor: theme.border,
    },
    pressed: {
      opacity: 0.85,
    },
    buttonLabel: {
      color: theme.onAccent,
      ...TypeScale.button,
      fontWeight: '900',
      letterSpacing: 1,
    },
  });
