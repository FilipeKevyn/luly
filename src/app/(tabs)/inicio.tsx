import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddToListSheet } from '@/components/add-to-list-sheet';
import { ThemedStatusBar } from '@/components/app-status-bar';
import { HardShadow } from '@/components/hard-shadow';
import { MovieCard } from '@/components/movie-card';
import { Text } from '@/components/text';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTheme, useThemedStyles } from '@/contexts/theme-context';
import { Brand, type ThemePalette } from '@/constants/theme';
import { TypeScale } from '@/constants/typography';
import { getFeaturedMovies, getHomeSections, type Movie } from '@/data/movies';
import { showNotice } from '@/utils/feedback';
import { formatRating } from '@/utils/format';
import { openMovie, openPlayer } from '@/utils/navigation';

const AVATAR_URI = 'https://picsum.photos/seed/luly-user/200/200';
const HERO_AUTO_ADVANCE_MS = 5000;

export default function InicioScreen() {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const featuredMovies = getFeaturedMovies();
  const slideCount = featuredMovies.length;
  const sections = getHomeSections();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [heroWidth, setHeroWidth] = useState(0);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetMovie, setSheetMovie] = useState<Movie | null>(null);
  const heroScrollRef = useRef<ScrollView>(null);
  const scrollSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncActiveIndex = useCallback(
    (offsetX: number) => {
      if (heroWidth <= 0 || slideCount === 0) {
        return;
      }
      const index = Math.round(offsetX / heroWidth);
      setActiveIndex(Math.max(0, Math.min(slideCount - 1, index)));
    },
    [heroWidth, slideCount]
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset } = event.nativeEvent;
      if (scrollSyncTimer.current) {
        clearTimeout(scrollSyncTimer.current);
      }
      scrollSyncTimer.current = setTimeout(() => {
        scrollSyncTimer.current = null;
        syncActiveIndex(contentOffset.x);
      }, 120);
    },
    [syncActiveIndex]
  );

  useEffect(() => {
    return () => {
      if (scrollSyncTimer.current) {
        clearTimeout(scrollSyncTimer.current);
      }
    };
  }, []);

  const goToSlide = useCallback(
    (index: number) => {
      if (heroWidth <= 0 || slideCount === 0) {
        return;
      }
      const next = ((index % slideCount) + slideCount) % slideCount;
      heroScrollRef.current?.scrollTo({ x: next * heroWidth, animated: true });
      setActiveIndex(next);
    },
    [heroWidth, slideCount]
  );

  const handleScrollEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  function openSheet(movie: Movie) {
    setSheetMovie(movie);
    setSheetVisible(true);
  }

  useFocusEffect(
    useCallback(() => {
      if (isDragging || sheetVisible || heroWidth <= 0 || slideCount < 2) {
        return;
      }
      const timer = setTimeout(() => {
        goToSlide(activeIndex + 1);
      }, HERO_AUTO_ADVANCE_MS);
      return () => clearTimeout(timer);
    }, [activeIndex, goToSlide, heroWidth, isDragging, sheetVisible, slideCount])
  );

  return (
    <View style={styles.screen}>
      <ThemedStatusBar />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <MaterialIcons name="star" size={24} color={theme.text} />
            <Text style={styles.brand}>luly</Text>
          </View>
          <View style={styles.headerActions}>
            <ThemeToggle />
            <Pressable
              onPress={() => showNotice('Notificações em breve.')}
              style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}>
              <MaterialIcons name="notifications-none" size={24} color={theme.text} />
            </Pressable>
            <Pressable
              onPress={() => showNotice('Perfil chega em breve.')}
              style={({ pressed }) => [pressed && styles.pressed]}>
              <Image source={{ uri: AVATAR_URI }} style={styles.avatar} contentFit="cover" />
            </Pressable>
          </View>
        </View>

        <View
          style={styles.heroViewport}
          onLayout={(event) => {
            const nextWidth = event.nativeEvent.layout.width;
            if (nextWidth > 0 && nextWidth !== heroWidth) {
              setHeroWidth(nextWidth);
            }
          }}>
          <ScrollView
            ref={heroScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScrollBeginDrag={() => setIsDragging(true)}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onScrollEndDrag={handleScrollEnd}
            onMomentumScrollEnd={handleScrollEnd}
            style={styles.heroScroll}>
            {featuredMovies.map((movie) => (
              <Pressable
                key={movie.id}
                onPress={() => openMovie(movie.id)}
                style={({ pressed }) => [
                  styles.heroFrame,
                  { width: heroWidth },
                  pressed && styles.pressed,
                ]}>
                <Image
                  source={{ uri: movie.hero }}
                  style={styles.heroImage}
                  contentFit="cover"
                  transition={200}
                />
                <View style={styles.heroScrim} />
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>
                    {movie.isNew ? 'ESTREIA LULY' : 'DESTAQUE LULY'}
                  </Text>
                </View>
                <View style={styles.heroContent}>
                  <View style={styles.heroMetaRow}>
                    <MaterialIcons name="star" size={15} color={theme.highlight} />
                    <Text style={styles.heroRating}>{formatRating(movie.rating)}</Text>
                    <Text style={styles.heroGenre}>{movie.genre}</Text>
                  </View>
                  <Text style={styles.heroTitle}>{movie.title}</Text>
                  <View style={styles.heroActions}>
                    <HardShadow offset={4} radius={6} style={styles.watchButton}>
                      <Pressable
                        onPress={() => openPlayer(movie.id)}
                        style={({ pressed }) => [styles.watchPress, pressed && styles.pressed]}>
                        <MaterialIcons name="play-arrow" size={22} color={theme.onAccent} />
                        <Text style={styles.watchLabel}>ASSISTIR</Text>
                      </Pressable>
                    </HardShadow>
                    <HardShadow offset={4} radius={6} style={styles.addButton}>
                      <Pressable
                        onPress={() => openSheet(movie)}
                        style={({ pressed }) => [styles.addPress, pressed && styles.pressed]}>
                        <MaterialIcons name="add" size={26} color={theme.text} />
                      </Pressable>
                    </HardShadow>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {slideCount > 1 ? (
          <View style={styles.dotsRow}>
            {featuredMovies.map((movie, index) => (
              <Pressable
                key={movie.id}
                onPress={() => goToSlide(index)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Destaque ${index + 1}: ${movie.title}`}
                accessibilityState={{ selected: index === activeIndex }}
                style={[styles.dot, index === activeIndex && styles.dotActive]}
              />
            ))}
          </View>
        ) : null}

        {sections.map((section) => (
          <View key={section.genre} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.genre}</Text>
              <Pressable
                onPress={() =>
                  router.navigate({
                    pathname: '/(tabs)/buscar',
                    params: { q: section.genre, t: String(Date.now()) },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={`Ver todos os filmes de ${section.genre}`}
                style={({ pressed }) => [styles.sectionAction, pressed && styles.pressed]}>
                <Text style={styles.sectionActionLabel}>VER TUDO</Text>
                <MaterialIcons name="arrow-forward" size={14} color={theme.accent} />
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.row}>
              {section.movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} onPress={() => openMovie(movie.id)} />
              ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      <AddToListSheet
        movie={sheetMovie}
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
      />
    </View>
  );
}

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scroll: {
      paddingBottom: 32,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    brand: {
      fontSize: 26,
      lineHeight: 32,
      fontWeight: '900',
      color: theme.text,
      letterSpacing: 0.5,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surface,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: theme.border,
      backgroundColor: theme.surfaceMuted,
    },
    heroViewport: {
      marginHorizontal: 20,
    },
    heroScroll: {
      width: '100%',
    },
    heroFrame: {
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: theme.mediaBackground,
      height: 420,
    },
    heroImage: {
      ...StyleSheet.absoluteFill,
    },
    heroScrim: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(0, 0, 0, 0.35)',
    },
    heroBadge: {
      position: 'absolute',
      top: 14,
      left: 14,
      backgroundColor: theme.accent,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 3,
      borderWidth: 2,
      borderColor: Brand.black,
    },
    heroBadgeText: {
      ...TypeScale.micro,
      fontWeight: '900',
      letterSpacing: 1.5,
      color: theme.onAccent,
    },
    heroContent: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 16,
      gap: 8,
    },
    heroMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    heroRating: {
      ...TypeScale.subtitle,
      fontWeight: '900',
      color: theme.onMedia,
    },
    heroGenre: {
      marginLeft: 4,
      ...TypeScale.subtitle,
      fontWeight: '700',
      color: theme.onMediaMuted,
    },
    heroTitle: {
      ...TypeScale.heroTitle,
      fontWeight: '900',
      color: theme.onMedia,
    },
    heroActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 6,
    },
    watchButton: {
      backgroundColor: theme.accent,
      borderRadius: 6,
    },
    watchPress: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    watchLabel: {
      ...TypeScale.button,
      fontWeight: '900',
      letterSpacing: 1.5,
      color: theme.onAccent,
    },
    addButton: {
      backgroundColor: theme.surface,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: theme.border,
    },
    addPress: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    dotsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 18,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.borderSubtle,
    },
    dotActive: {
      backgroundColor: theme.text,
    },
    section: {
      marginBottom: 26,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      marginBottom: 12,
    },
    sectionTitle: {
      ...TypeScale.sectionTitle,
      fontWeight: '900',
      color: theme.text,
    },
    sectionAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    sectionActionLabel: {
      ...TypeScale.caption,
      fontWeight: '900',
      letterSpacing: 1,
      color: theme.accent,
    },
    row: {
      paddingHorizontal: 20,
      gap: 16,
      paddingBottom: 6,
    },
    pressed: {
      opacity: 0.85,
    },
  });
