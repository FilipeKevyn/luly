import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useRef, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HardShadow } from "@/components/hard-shadow";
import { MovieCard } from "@/components/movie-card";
import { Text } from "@/components/text";
import { Brand } from "@/constants/theme";
import { FontFamily, TypeScale } from "@/constants/typography";
import { searchMovies, type Movie } from "@/data/movies";
import { openMovie } from "@/utils/navigation";

const SEARCH_PLACEHOLDER = "filmes para uma noite...";

const SEARCH_FILTERS = [
  { key: "tudo", label: "Tudo" },
  { key: "drama", label: "Drama" },
  { key: "comedia", label: "Comédia" },
  { key: "ficcao", label: "Ficção" },
  { key: "brasil", label: "Brasil" },
] as const;

type SearchFilterKey = (typeof SEARCH_FILTERS)[number]["key"];

const SORT_ORDER = ["avaliacao", "recentes", "alfabetico"] as const;

type SortKey = (typeof SORT_ORDER)[number];

const SORT_LABELS: Record<SortKey, string> = {
  avaliacao: "Melhor avaliados",
  recentes: "Mais recentes",
  alfabetico: "A–Z",
};

interface SortSheetProps {
  visible: boolean;
  selected: SortKey;
  bottomInset: number;
  onClose: () => void;
  onSelect: (sort: SortKey) => void;
}

export default function BuscarScreen() {
  const params = useLocalSearchParams<{ q?: string; t?: string }>();
  const incomingQuery = typeof params.q === "string" ? params.q : "";
  const requestKey = typeof params.t === "string" ? params.t : incomingQuery;

  return <SearchContent key={requestKey} initialQuery={incomingQuery} />;
}

interface SearchContentProps {
  initialQuery: string;
}

function SearchContent({ initialQuery }: SearchContentProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<SearchFilterKey>("tudo");
  const [sort, setSort] = useState<SortKey>("avaliacao");
  const [sortSheetVisible, setSortSheetVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const results = useMemo(() => {
    const matched = searchMovies(query).filter((movie) =>
      matchesFilter(movie, filter),
    );
    return sortMovies(matched, sort);
  }, [filter, query, sort]);

  const resultsSubtitle =
    results.length === 1
      ? "1 filme combina com seu momento"
      : `${results.length} filmes combinam com seu momento`;

  function clearQuery() {
    setQuery("");
    inputRef.current?.focus();
  }

  function resetSearch() {
    setQuery("");
    setFilter("tudo");
    inputRef.current?.blur();
  }

  function openSortSheet() {
    inputRef.current?.blur();
    setSortSheetVisible(true);
  }

  function selectSort(nextSort: SortKey) {
    setSort(nextSort);
    setSortSheetVisible(false);
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Descobrir</Text>
        </View>

        <HardShadow
          offset={4}
          radius={6}
          containerStyle={styles.searchShadow}
          style={styles.searchField}
        >
          <View style={styles.searchRow}>
            <MaterialIcons name="search" size={22} color={Brand.red} />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => inputRef.current?.blur()}
              placeholder={SEARCH_PLACEHOLDER}
              placeholderTextColor={Brand.muted}
              selectionColor={Brand.red}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Buscar filmes"
              style={styles.searchInput}
            />
            {query.length > 0 ? (
              <Pressable
                onPress={clearQuery}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Limpar busca"
                style={({ pressed }) => pressed && styles.pressed}
              >
                <MaterialIcons name="close" size={22} color={Brand.muted} />
              </Pressable>
            ) : null}
          </View>
        </HardShadow>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {SEARCH_FILTERS.map((item) => {
            const active = filter === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setFilter(item.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[styles.chipLabel, active && styles.chipLabelActive]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.resultsHeader}>
          <View style={styles.resultsTitles}>
            <Text accessibilityRole="header" style={styles.resultsTitle}>
              Achados para você
            </Text>
            <Text
              style={styles.resultsSubtitle}
              accessibilityLiveRegion="polite"
            >
              {resultsSubtitle}
            </Text>
          </View>
          <Pressable
            onPress={openSortSheet}
            accessibilityRole="button"
            accessibilityLabel={`Ordenar por ${SORT_LABELS[sort]}`}
            style={({ pressed }) => [
              styles.sortButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.sortLabel}>{SORT_LABELS[sort]}</Text>
            <MaterialIcons name="swap-vert" size={16} color={Brand.red} />
          </Pressable>
        </View>

        {results.length > 0 ? (
          <View style={styles.grid}>
            {results.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                variant="search"
                onPress={() => openMovie(movie.id)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyBlock}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="search-off" size={32} color={Brand.paper} />
            </View>
            <Text style={styles.emptyTitle}>Nenhum filme encontrado</Text>
            <Text style={styles.emptyDescription}>
              Tente outra palavra ou remova o filtro selecionado.
            </Text>
            <HardShadow
              offset={5}
              radius={8}
              containerStyle={styles.emptyButtonWrapper}
              style={styles.emptyButton}
            >
              <Pressable
                onPress={resetSearch}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.emptyButtonPress,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.emptyButtonLabel}>LIMPAR BUSCA</Text>
              </Pressable>
            </HardShadow>
          </View>
        )}
      </ScrollView>

      <SortSheet
        visible={sortSheetVisible}
        selected={sort}
        bottomInset={insets.bottom}
        onClose={() => setSortSheetVisible(false)}
        onSelect={selectSort}
      />
    </View>
  );
}

function SortSheet({
  visible,
  selected,
  bottomInset,
  onClose,
  onSelect,
}: SortSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.sheetRoot}>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fechar ordenação"
          style={styles.sheetBackdrop}
        />
        <View style={[styles.sheet, { paddingBottom: bottomInset + 20 }]}>
          <View style={styles.sheetHandle} />
          <Text accessibilityRole="header" style={styles.sheetTitle}>
            Ordenar por
          </Text>
          {SORT_ORDER.map((key) => {
            const active = key === selected;
            return (
              <Pressable
                key={key}
                onPress={() => onSelect(key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [
                  styles.sheetOption,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.sheetOptionLabel,
                    active && styles.sheetOptionLabelActive,
                  ]}
                >
                  {SORT_LABELS[key]}
                </Text>
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active ? <View style={styles.radioDot} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

function matchesFilter(movie: Movie, filter: SearchFilterKey): boolean {
  switch (filter) {
    case "tudo":
      return true;
    case "brasil":
      // O catálogo mock é inteiramente de produções brasileiras.
      return true;
    case "drama":
      return movie.genres.includes("Drama");
    case "comedia":
      return movie.genres.includes("Comédia");
    case "ficcao":
      return movie.genres.includes("Ficção científica");
    default: {
      const exhaustive: never = filter;
      throw new Error(`Filtro desconhecido: ${String(exhaustive)}`);
    }
  }
}

function sortMovies(movies: readonly Movie[], sort: SortKey): Movie[] {
  const sorted = [...movies];
  switch (sort) {
    case "avaliacao":
      return sorted.sort((a, b) => b.rating - a.rating);
    case "recentes":
      return sorted.sort(
        (a, b) => b.year - a.year || b.matchPercent - a.matchPercent,
      );
    case "alfabetico":
      return sorted.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
    default: {
      const exhaustive: never = sort;
      throw new Error(`Ordenação desconhecida: ${String(exhaustive)}`);
    }
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.paper,
  },
  scroll: {
    paddingBottom: Platform.OS === "web" ? 96 : 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  title: {
    ...TypeScale.screenTitle,
    fontWeight: "900",
    color: Brand.ink,
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Brand.black,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.paper,
  },
  filterButtonActive: {
    backgroundColor: Brand.ink,
  },
  searchShadow: {
    marginHorizontal: 20,
    marginTop: 18,
  },
  searchField: {
    borderRadius: 6,
    borderWidth: 3,
    borderColor: Brand.red,
    backgroundColor: Brand.paper,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
    fontFamily: FontFamily.bold,
    fontSize: 16,
    lineHeight: 22,
    color: Brand.ink,
    outlineWidth: 0,
  },
  chipsRow: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
  },
  chipActive: {
    backgroundColor: Brand.red,
    borderColor: Brand.black,
  },
  chipLabel: {
    ...TypeScale.caption,
    fontWeight: "900",
    color: Brand.ink,
  },
  chipLabelActive: {
    color: Brand.paper,
  },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 26,
    marginBottom: 16,
  },
  resultsTitles: {
    flex: 1,
    gap: 2,
  },
  resultsTitle: {
    ...TypeScale.resultsTitle,
    fontWeight: "900",
    color: Brand.ink,
  },
  resultsSubtitle: {
    ...TypeScale.subtitle,
    color: Brand.muted,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingBottom: 2,
  },
  sortLabel: {
    ...TypeScale.caption,
    fontWeight: "900",
    color: Brand.red,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    rowGap: 24,
  },
  emptyBlock: {
    alignItems: "center",
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
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    ...TypeScale.emptyTitle,
    fontWeight: "900",
    color: Brand.ink,
    textAlign: "center",
  },
  emptyDescription: {
    ...TypeScale.body,
    color: Brand.muted,
    textAlign: "center",
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
    fontWeight: "900",
    letterSpacing: 1.5,
    color: Brand.paper,
  },
  sheetRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(17, 17, 20, 0.45)",
  },
  sheet: {
    backgroundColor: Brand.paper,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 2,
    borderColor: Brand.black,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Brand.line,
    marginBottom: 10,
  },
  sheetTitle: {
    ...TypeScale.modalTitle,
    fontWeight: "900",
    color: Brand.ink,
    marginBottom: 8,
  },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Brand.line,
  },
  sheetOptionLabel: {
    ...TypeScale.bodyLarge,
    fontWeight: "700",
    color: Brand.ink,
  },
  sheetOptionLabelActive: {
    color: Brand.red,
    fontWeight: "900",
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Brand.black,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: {
    borderColor: Brand.red,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Brand.red,
  },
  pressed: {
    opacity: 0.85,
  },
});
