import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HardShadow } from '@/components/hard-shadow';
import { MovieCard } from '@/components/movie-card';
import { ScreenMessage } from '@/components/screen-message';
import { Text } from '@/components/text';
import { Brand } from '@/constants/theme';
import { TypeScale } from '@/constants/typography';
import { getMovieById, type Movie } from '@/data/movies';
import {
  deleteLista,
  getListaPorId,
  listFilmesDaLista,
  removeFilmeDaLista,
  type Lista,
} from '@/db/repositories';
import { showNotice } from '@/utils/feedback';
import { goBackOrHome, openMovie } from '@/utils/navigation';

type LayoutMode = 'grid' | 'list';

type ListaState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'ready'; lista: Lista; movies: Movie[] };

export default function ListaScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);

  if (!Number.isFinite(id)) {
    return (
      <>
        <StatusBar style="dark" />
        <ScreenMessage
          icon="bookmark-border"
          title="Lista não encontrada"
          description="A lista que você tentou abrir não existe mais."
          actionLabel="VOLTAR"
          onAction={goBackOrHome}
        />
      </>
    );
  }

  return <ListaContent listaId={id} />;
}

function ListaContent({ listaId }: { listaId: number }) {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<ListaState>({ status: 'loading' });
  const [layout, setLayout] = useState<LayoutMode>('grid');

  const load = useCallback(async () => {
    try {
      const lista = await getListaPorId(listaId);
      if (!lista) {
        setState({ status: 'missing' });
        return;
      }
      const ids = await listFilmesDaLista(listaId);
      const movies = ids
        .map((id) => getMovieById(id))
        .filter((movie): movie is Movie => movie !== null);
      setState({ status: 'ready', lista, movies });
    } catch {
      showNotice('Não foi possível carregar a lista.');
      setState({ status: 'missing' });
    }
  }, [listaId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function removeMovie(movie: Movie, listaNome: string) {
    try {
      await removeFilmeDaLista(listaId, movie.id);
      setState((current) =>
        current.status === 'ready'
          ? { ...current, movies: current.movies.filter((item) => item.id !== movie.id) }
          : current
      );
      showNotice(`Removido de "${listaNome}".`);
    } catch {
      showNotice('Não foi possível remover o filme.');
    }
  }

  async function removeLista(lista: Lista) {
    try {
      await deleteLista(lista.id);
      showNotice(`Lista "${lista.nome}" excluída.`);
      if (!router.canGoBack()) {
        router.replace('/(tabs)/minha-lista');
        return;
      }
      router.back();
    } catch {
      showNotice('Não foi possível excluir a lista.');
    }
  }

  function confirmDelete(lista: Lista) {
    Alert.alert(
      'Excluir lista',
      `Excluir "${lista.nome}"? Os filmes continuam salvos nas suas outras listas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            void removeLista(lista);
          },
        },
      ]
    );
  }

  if (state.status === 'loading') {
    return (
      <View style={styles.screen}>
        <StatusBar style="dark" />
        <View style={[styles.loading, { paddingTop: insets.top }]}>
          <ActivityIndicator color={Brand.red} />
        </View>
      </View>
    );
  }

  if (state.status === 'missing') {
    return (
      <>
        <StatusBar style="dark" />
        <ScreenMessage
          icon="bookmark-border"
          title="Lista não encontrada"
          description="A lista que você tentou abrir não existe mais."
          actionLabel="VOLTAR"
          onAction={goBackOrHome}
        />
      </>
    );
  }

  const { lista, movies } = state;

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 8 }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable
            onPress={goBackOrHome}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <MaterialIcons name="arrow-back" size={22} color={Brand.ink} />
          </Pressable>
          <Pressable
            onPress={() => confirmDelete(lista)}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <MaterialIcons name="delete-outline" size={22} color={Brand.red} />
          </Pressable>
        </View>

        <View style={styles.header}>
          <Text style={styles.kicker}>LISTA</Text>
          <Text style={styles.title}>{lista.nome}</Text>
          <Text style={styles.subtitle}>
            {movies.length === 1 ? '1 título salvo' : `${movies.length} títulos salvos`}
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Filmes salvos</Text>
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

        {movies.length === 0 ? (
          <View style={styles.emptyBlock}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="bookmark-border" size={32} color={Brand.paper} />
            </View>
            <Text style={styles.emptyTitle}>Nada por aqui ainda</Text>
            <Text style={styles.emptyDescription}>
              Abra um filme e toque em + para salvar nesta lista.
            </Text>
            <HardShadow
              offset={5}
              radius={8}
              containerStyle={styles.emptyButtonWrapper}
              style={styles.emptyButton}>
              <Pressable
                onPress={() => router.navigate('/(tabs)/inicio')}
                style={({ pressed }) => [styles.emptyButtonPress, pressed && styles.pressed]}>
                <Text style={styles.emptyButtonLabel}>DESCOBRIR FILMES</Text>
              </Pressable>
            </HardShadow>
          </View>
        ) : layout === 'grid' ? (
          <View style={styles.grid}>
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                variant="grid"
                onPress={() => openMovie(movie.id)}
                onRemove={() => {
                  void removeMovie(movie, lista.nome);
                }}
              />
            ))}
          </View>
        ) : (
          <View style={styles.list}>
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                variant="list"
                onPress={() => openMovie(movie.id)}
                onRemove={() => {
                  void removeMovie(movie, lista.nome);
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.paper,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Brand.black,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.paper,
  },
  header: {
    paddingHorizontal: 20,
    gap: 4,
  },
  kicker: {
    ...TypeScale.micro,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: Brand.red,
  },
  title: {
    ...TypeScale.screenTitle,
    fontWeight: '900',
    color: Brand.ink,
  },
  subtitle: {
    ...TypeScale.subtitle,
    color: Brand.muted,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    ...TypeScale.sectionTitle,
    fontWeight: '900',
    color: Brand.ink,
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
    paddingVertical: 32,
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
    ...TypeScale.emptyTitle,
    fontWeight: '900',
    color: Brand.ink,
    textAlign: 'center',
  },
  emptyDescription: {
    ...TypeScale.body,
    color: Brand.muted,
    textAlign: 'center',
  },
  emptyButtonWrapper: {
    marginTop: 8,
  },
  emptyButton: {
    backgroundColor: Brand.red,
    borderRadius: 8,
  },
  emptyButtonPress: {
    paddingHorizontal: 26,
    paddingVertical: 15,
  },
  emptyButtonLabel: {
    ...TypeScale.button,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: Brand.paper,
  },
  pressed: {
    opacity: 0.85,
  },
});
