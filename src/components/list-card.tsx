import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { HardShadow } from '@/components/hard-shadow';
import { Text } from '@/components/text';
import { useTheme, useThemedStyles } from '@/contexts/theme-context';
import type { ThemePalette } from '@/constants/theme';
import { TypeScale } from '@/constants/typography';
import type { ListaComContagem } from '@/db/repositories';

export interface ListaView extends ListaComContagem {
  covers: string[];
}

export interface ListCardProps {
  lista: ListaView;
  onPress: () => void;
}

export function ListCard({ lista, onPress }: ListCardProps) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <HardShadow offset={5} radius={10} style={styles.card}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.press, pressed && styles.pressed]}>
        <View style={styles.cover}>
          {lista.covers.length === 0 ? (
            <View style={styles.coverEmpty}>
              <MaterialIcons name="bookmark" size={26} color={theme.onAccent} />
            </View>
          ) : lista.covers.length === 1 ? (
            <Image source={{ uri: lista.covers[0] }} style={styles.coverSingle} contentFit="cover" transition={150} />
          ) : (
            <View style={styles.mosaic}>
              {lista.covers.map((cover, index) => (
                <Image
                  key={`${lista.id}-${index}`}
                  source={{ uri: cover }}
                  style={styles.mosaicTile}
                  contentFit="cover"
                  transition={150}
                />
              ))}
            </View>
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {lista.nome}
          </Text>
          <Text style={styles.count}>{lista.total === 1 ? '1 título' : `${lista.total} títulos`}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={26} color={theme.text} />
      </Pressable>
    </HardShadow>
  );
}

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.surface,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.border,
    },
    press: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: 12,
    },
    cover: {
      width: 58,
      height: 58,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: theme.border,
      overflow: 'hidden',
      backgroundColor: theme.surfaceMuted,
    },
    coverEmpty: {
      flex: 1,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    coverSingle: {
      width: '100%',
      height: '100%',
    },
    mosaic: {
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    mosaicTile: {
      width: '50%',
      height: '50%',
    },
    info: {
      flex: 1,
      gap: 3,
    },
    name: {
      ...TypeScale.cardTitle,
      fontWeight: '900',
      color: theme.text,
    },
    count: {
      ...TypeScale.caption,
      color: theme.textMuted,
    },
    pressed: {
      opacity: 0.85,
    },
  });
