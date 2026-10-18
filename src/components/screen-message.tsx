import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';

type ScreenMessageProps = {
  icon?: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function ScreenMessage({ icon = 'movie', title, description, actionLabel, onAction }: ScreenMessageProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <MaterialIcons name={icon} size={34} color={Brand.paper} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
    backgroundColor: Brand.canvas,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Brand.red,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Brand.black,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: Brand.ink,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: Brand.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: Brand.red,
    borderWidth: 2,
    borderColor: Brand.black,
  },
  pressed: {
    opacity: 0.85,
  },
  buttonLabel: {
    color: Brand.paper,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
