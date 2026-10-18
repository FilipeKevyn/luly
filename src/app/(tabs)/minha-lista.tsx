import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CreateListModal } from '@/components/create-list-modal';
import { HardShadow } from '@/components/hard-shadow';
import { MovieCard } from '@/components/movie-card';
import { Brand } from '@/constants/theme';
import { getMovieById, type Movie } from '@/data/movies';
import {
  getContinueAssistindo,
  listFilmesSalvos,
  USUARIO_DEMO_ID,
} from '@/db/repositories';
import { showNotice } from '@/utils/feedback';
import { openMovie, openPlayer } from '@/utils/navigation';

type FilterKey = 'todos' | 'filmes' | 'series' | 'baixados';
type LayoutMode = 'grid' | 'list';

export default function MinhaListaScreen() {
  const insets = useSafeAreaInsets();
  const [saved, setSaved] = useState<Movie[]>([]);
  const [continueWatching, setContinueWatching] = useState<Movie | null>(null);
  const [filter, setFilter] = useState<FilterKey>('todos');
  const [layout, setLayout] = useState<LayoutMode>('grid');
  const [createVisible, setCreateVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      const [savedIds, views] = await Promise.all([
        listFilmesSalvos(USUARIO_DEMO_ID),
        getContinueAssistindo(USUARIO_DEMO_ID),
      ]);
      const movies = savedIds
        .map((id) => getMovieById(id))
        .filter((movie): movie is Movie => movie !== null);
      setSaved(movies);
      const nextView = views.find((view) => getMovieById(view.filme_id) !== null);
      setContinueWatching(nextView ? getMovieById(nextView.filme_id) : null);
    } catch {
      showNotice('Não foi possível carregar sua lista.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const chips: { key: FilterKey; label: string; disabled?: boolean }[] = [
    { key: 'todos', label: `Todos ${saved.length}` },
    { key: 'filmes', label: `Filmes ${saved.length}` },
    { key: 'series', label: 'Séries 0' },
    { key: 'baixados', label: 'Baixados', disabled: true },
  ];

  const showMovies = filter === 'todos' || filter === 'filmes';

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Minha lista</Text>
          <Pressable
            onPress={() => setCreateVisible(true)}
            style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}>
            <MaterialIcons name="more-horiz" size={24} color={Brand.ink} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}>
          {chips.map((chip) => {
            const active = filter === chip.key;
            return (
              <Pressable
                key={chip.key}
                disabled={chip.disabled}
                onPress={() => setFilter(chip.key)}
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  chip.disabled && styles.chipDisabled,
                  pressed && styles.pressed,
                ]}>
                <Text
                  style={[
                    styles.chipLabel,
                    active && styles.chipLabelActive,
                    chip.disabled && styles.chipLabelDisabled,
                  ]}>
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {showMovies && continueWatching ? (
          <HardShadow offset={5} radius={10} containerStyle={styles.continueWrapper} style={styles.continueCard}>
            <Pressable
              onPress={() => openPlayer(continueWatching.id)}
              style={({ pressed }) => [styles.continuePress, pressed && styles.pressed]}>
              <Image
                source={{ uri: continueWatching.poster }}
                style={styles.continuePoster}
                contentFit="cover"
              />
              <View style={styles.continueInfo}>
                <Text style={styles.continueKicker}>CONTINUE ASSISTINDO</Text>
                <Text style={styles.continueTitle} numberOfLines={1}>
                  {continueWatching.title}
                </Text>
                <View style={styles.continueBar}>
                  <View style={styles.continueBarFill} />
                </View>
              </View>
              <View style={styles.continuePlay}>
                <MaterialIcons name="play-arrow" size={24} color={Brand.paper} />
              </View>
            </Pressable>
          </HardShadow>
        ) : null}

        {showMovies ? (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitles}>
                <Text style={styles.sectionTitle}>Salvos para depois</Text>
                <Text style={styles.sectionSubtitle}>
                  {saved.length === 1 ? '1 título na sua coleção' : `${saved.length} títulos na sua coleção`}
                </Text>
              </View>
              <View style={styles.layoutToggle}>
                <Pressable
                  onPress={() => setLayout('grid')}
                  style={[styles.layoutButton, layout === 'grid' && styles.layoutButtonActive]}>
                  <MaterialIcons
                    name="grid-view"
                    size={20}
                    color={layout === 'grid' ? Brand.paper : Brand.ink}
                  />
                </Pressable>
                <Pressable
                  onPress={() => setLayout('list')}
                  style={[styles.layoutButton, layout === 'list' && styles.layoutButtonActive]}>
                  <MaterialIcons
                    name="view-list"
                    size={20}
                    color={layout === 'list' ? Brand.paper : Brand.ink}
                  />
                </Pressable>
              </View>
            </View>

            {saved.length === 0 ? (
              <View style={styles.emptyBlock}>
                <View style={styles.emptyIcon}>
                  <MaterialIcons name="bookmark-border" size={32} color={Brand.paper} />
                </View>
                <Text style={styles.emptyTitle}>Você ainda não salvou nada</Text>
                <Text style={styles.emptyDescription}>
                  Toque no + de um filme para guardar aqui e assistir quando quiser.
                </Text>
                <HardShadow offset={5} radius={8} style={styles.emptyButton}>
                  <Pressable
                    onPress={() => router.navigate('/(tabs)/inicio')}
                    style={({ pressed }) => [styles.emptyButtonPress, pressed && styles.pressed]}>
                    <Text style={styles.emptyButtonLabel}>DESCOBRIR FILMES</Text>
                  </Pressable>
                </HardShadow>
              </View>
            ) : layout === 'grid' ? (
              <View style={styles.grid}>
                {saved.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    variant="grid"
                    onPress={() => openMovie(movie.id)}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.list}>
                {saved.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    variant="list"
                    onPress={() => openMovie(movie.id)}
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyBlock}>
            <View style={styles.emptyIcon}>
              <MaterialIcons
                name={filter === 'series' ? 'movie' : 'search-off'}
                size={32}
                color={Brand.paper}
              />
            </View>
            <Text style={styles.emptyTitle}>
              {filter === 'series' ? 'Nada de séries por aqui' : 'Baixados chega em breve'}
            </Text>
            <Text style={styles.emptyDescription}>
              {filter === 'series'
                ? 'O catálogo da Luly, por enquanto, é só de filmes.'
                : 'Enquanto isso, você pode assistir tudo com internet.'}
            </Text>
          </View>
        )}
      </ScrollView>

      <CreateListModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onCreated={(lista) => showNotice(`Lista "${lista.nome}" criada.`)}
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: Brand.ink,
  },
  moreButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Brand.black,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.paper,
  },
  chipsRow: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Brand.black,
    backgroundColor: Brand.paper,
  },
  chipActive: {
    backgroundColor: Brand.red,
  },
  chipDisabled: {
    borderColor: Brand.line,
    backgroundColor: Brand.canvas,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: Brand.ink,
  },
  chipLabelActive: {
    color: Brand.paper,
  },
  chipLabelDisabled: {
    color: Brand.muted,
  },
  continueWrapper: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  continueCard: {
    backgroundColor: Brand.paper,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Brand.red,
  },
  continuePress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  continuePoster: {
    width: 46,
    height: 62,
    borderRadius: 4,
    backgroundColor: Brand.canvas,
  },
  continueInfo: {
    flex: 1,
    gap: 4,
  },
  continueKicker: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: Brand.red,
  },
  continueTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Brand.ink,
  },
  continueBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Brand.line,
    overflow: 'hidden',
    marginTop: 2,
  },
  continueBarFill: {
    width: '45%',
    height: '100%',
    backgroundColor: Brand.red,
  },
  continuePlay: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: Brand.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 26,
    marginBottom: 16,
  },
  sectionTitles: {
    flex: 1,
    gap: 3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Brand.ink,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Brand.muted,
  },
  layoutToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  layoutButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Brand.black,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.paper,
  },
  layoutButtonActive: {
    backgroundColor: Brand.ink,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    rowGap: 24,
  },
  list: {
    paddingHorizontal: 20,
  },
  emptyBlock: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 40,
    gap: 10,
  },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: Brand.red,
    borderWidth: 2,
    borderColor: Brand.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Brand.ink,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: Brand.muted,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: Brand.red,
    borderRadius: 8,
    marginTop: 8,
  },
  emptyButtonPress: {
    paddingHorizontal: 26,
    paddingVertical: 15,
  },
  emptyButtonLabel: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: Brand.paper,
  },
  pressed: {
    opacity: 0.85,
  },
});
