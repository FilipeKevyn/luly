import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { HardShadow } from '@/components/hard-shadow';
import { Text } from '@/components/text';
import { Brand } from '@/constants/theme';
import { TypeScale } from '@/constants/typography';
import type { Movie } from '@/data/movies';
import { formatDuration } from '@/utils/format';

type MovieCardProps = {
  movie: Movie;
  variant?: 'carousel' | 'grid' | 'list' | 'search';
  onPress: () => void;
  onRemove?: () => void;
};

export function MovieCard({ movie, variant = 'carousel', onPress, onRemove }: MovieCardProps) {
  if (variant === 'list') {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.listRow, pressed && styles.pressed]}>
        <Image source={{ uri: movie.poster }} style={styles.listPoster} contentFit="cover" transition={150} />
        <View style={styles.listInfo}>
          <Text style={styles.listTitle} numberOfLines={1}>
            {movie.title}
          </Text>
          <Text style={styles.listMeta}>
            {movie.genre} • {movie.year}
          </Text>
        </View>
        {onRemove ? (
          <Pressable
            onPress={onRemove}
            hitSlop={8}
            style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}>
            <MaterialIcons name="close" size={16} color={Brand.paper} />
          </Pressable>
        ) : (
          <MaterialIcons name="chevron-right" size={26} color={Brand.ink} />
        )}
      </Pressable>
    );
  }

  const isGrid = variant === 'grid';
  const isSearch = variant === 'search';
  const usesGridLayout = isGrid || isSearch;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        isSearch ? `${movie.title}, ${movie.matchPercent}% para você` : movie.title
      }
      style={({ pressed }) => [
        isSearch ? styles.searchCard : isGrid ? styles.gridCard : styles.carouselCard,
        pressed && styles.pressed,
      ]}>
      <HardShadow radius={6} offset={5} style={styles.posterFrame}>
        <Image
          source={{ uri: isSearch ? movie.hero : movie.poster }}
          style={
            isSearch
              ? styles.searchPoster
              : isGrid
                ? styles.gridPoster
                : styles.carouselPoster
          }
          contentFit="cover"
          transition={150}
        />
        {isSearch ? (
          <View style={styles.matchBadge}>
            <Text style={styles.matchBadgeText}>{movie.matchPercent}% para você</Text>
          </View>
        ) : null}
        {isGrid && movie.isNew ? (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NOVO</Text>
          </View>
        ) : null}
        {isGrid && onRemove ? (
          <Pressable
            onPress={onRemove}
            hitSlop={8}
            style={({ pressed }) => [styles.removeOverlay, pressed && styles.pressed]}>
            <MaterialIcons name="close" size={16} color={Brand.paper} />
          </Pressable>
        ) : null}
      </HardShadow>
      <Text style={usesGridLayout ? styles.gridTitle : styles.carouselTitle} numberOfLines={2}>
        {movie.title}
      </Text>
      <Text style={styles.meta}>
        {movie.genre} • {usesGridLayout ? movie.year : formatDuration(movie.durationMin)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  carouselCard: {
    width: 148,
  },
  carouselTitle: {
    marginTop: 10,
    ...TypeScale.cardTitleSmall,
    fontWeight: '900',
    color: Brand.ink,
  },
  gridCard: {
    width: '48%',
  },
  searchCard: {
    width: '48%',
  },
  gridTitle: {
    marginTop: 10,
    ...TypeScale.cardTitle,
    fontWeight: '900',
    color: Brand.ink,
  },
  posterFrame: {
    borderRadius: 6,
    backgroundColor: Brand.black,
  },
  carouselPoster: {
    width: '100%',
    height: 212,
    borderRadius: 6,
  },
  gridPoster: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 6,
  },
  searchPoster: {
    width: '100%',
    aspectRatio: 3 / 2,
    borderRadius: 6,
  },
  matchBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#A9F5C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
    borderWidth: 1.5,
    borderColor: Brand.black,
  },
  matchBadgeText: {
    ...TypeScale.micro,
    fontWeight: '900',
    letterSpacing: 0.2,
    color: Brand.black,
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Brand.yellow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
    borderWidth: 1.5,
    borderColor: Brand.black,
  },
  newBadgeText: {
    ...TypeScale.micro,
    fontWeight: '900',
    letterSpacing: 1,
    color: Brand.black,
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Brand.black,
    backgroundColor: Brand.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Brand.black,
    backgroundColor: Brand.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    marginTop: 3,
    ...TypeScale.caption,
    color: Brand.muted,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
  },
  listPoster: {
    width: 54,
    height: 78,
    borderRadius: 4,
    backgroundColor: Brand.black,
  },
  listInfo: {
    flex: 1,
    gap: 4,
  },
  listTitle: {
    ...TypeScale.cardTitle,
    fontWeight: '900',
    color: Brand.ink,
  },
  listMeta: {
    ...TypeScale.caption,
    color: Brand.muted,
  },
  pressed: {
    opacity: 0.8,
  },
});
