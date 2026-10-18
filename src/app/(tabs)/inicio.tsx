import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddToListSheet } from '@/components/add-to-list-sheet';
import { HardShadow } from '@/components/hard-shadow';
import { MovieCard } from '@/components/movie-card';
import { Brand } from '@/constants/theme';
import { getFeaturedMovie, getHomeSections } from '@/data/movies';
import { showNotice } from '@/utils/feedback';
import { formatRating } from '@/utils/format';
import { openMovie, openPlayer } from '@/utils/navigation';

const AVATAR_URI = 'https://picsum.photos/seed/luly-user/200/200';

export default function InicioScreen() {
  const insets = useSafeAreaInsets();
  const featured = getFeaturedMovie();
  const sections = getHomeSections();
  const [sheetVisible, setSheetVisible] = useState(false);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <MaterialIcons name="star" size={24} color={Brand.ink} />
            <Text style={styles.brand}>luly</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => showNotice('Notificações em breve.')}
              style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}>
              <MaterialIcons name="notifications-none" size={24} color={Brand.ink} />
            </Pressable>
            <Pressable
              onPress={() => showNotice('Perfil chega em breve.')}
              style={({ pressed }) => [pressed && styles.pressed]}>
              <Image source={{ uri: AVATAR_URI }} style={styles.avatar} contentFit="cover" />
            </Pressable>
          </View>
        </View>

        <Pressable onPress={() => openMovie(featured.id)} style={({ pressed }) => [pressed && styles.pressed]}>
          <View style={styles.heroFrame}>
            <Image
              source={{ uri: featured.hero }}
              style={styles.heroImage}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.heroScrim} />
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>ESTREIA LULY</Text>
            </View>
            <View style={styles.heroContent}>
              <View style={styles.heroMetaRow}>
                <MaterialIcons name="star" size={15} color={Brand.yellow} />
                <Text style={styles.heroRating}>{formatRating(featured.rating)}</Text>
                <Text style={styles.heroGenre}>{featured.genre}</Text>
              </View>
              <Text style={styles.heroTitle}>{featured.title}</Text>
              <View style={styles.heroActions}>
                <HardShadow offset={4} radius={6} style={styles.watchButton}>
                  <Pressable
                    onPress={() => openPlayer(featured.id)}
                    style={({ pressed }) => [styles.watchPress, pressed && styles.pressed]}>
                    <MaterialIcons name="play-arrow" size={22} color={Brand.paper} />
                    <Text style={styles.watchLabel}>ASSISTIR</Text>
                  </Pressable>
                </HardShadow>
                <HardShadow offset={4} radius={6} style={styles.addButton}>
                  <Pressable
                    onPress={() => setSheetVisible(true)}
                    style={({ pressed }) => [styles.addPress, pressed && styles.pressed]}>
                    <MaterialIcons name="add" size={26} color={Brand.ink} />
                  </Pressable>
                </HardShadow>
              </View>
            </View>
          </View>
        </Pressable>

        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        {sections.map((section) => (
          <View key={section.genre} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.genre}</Text>
              <Pressable
                onPress={() => showNotice('A busca chega em breve.')}
                style={({ pressed }) => [styles.sectionAction, pressed && styles.pressed]}>
                <Text style={styles.sectionActionLabel}>VER TUDO</Text>
                <MaterialIcons name="arrow-forward" size={14} color={Brand.red} />
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
        movie={sheetVisible ? featured : null}
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.paper,
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
    fontWeight: '900',
    color: Brand.ink,
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
    borderColor: Brand.black,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.paper,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Brand.black,
    backgroundColor: Brand.canvas,
  },
  heroFrame: {
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Brand.black,
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
    backgroundColor: Brand.red,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: Brand.black,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: Brand.paper,
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
    fontSize: 13,
    fontWeight: '900',
    color: Brand.paper,
  },
  heroGenre: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
    color: Brand.paper,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  watchButton: {
    backgroundColor: Brand.red,
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
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: Brand.paper,
  },
  addButton: {
    backgroundColor: Brand.paper,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Brand.black,
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
    backgroundColor: Brand.line,
  },
  dotActive: {
    backgroundColor: Brand.ink,
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
    fontSize: 22,
    fontWeight: '900',
    color: Brand.ink,
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionActionLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    color: Brand.red,
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
