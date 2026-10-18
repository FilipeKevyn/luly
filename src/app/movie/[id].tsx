import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AddToListSheet } from "@/components/add-to-list-sheet";
import { HardShadow } from "@/components/hard-shadow";
import { ScreenMessage } from "@/components/screen-message";
import { Brand } from "@/constants/theme";
import { getMovieById, type Movie } from "@/data/movies";
import { isFilmeEmAlgumaLista, USUARIO_DEMO_ID } from "@/db/repositories";
import { showNotice } from "@/utils/feedback";
import { formatDuration, formatRating } from "@/utils/format";
import { goBackOrHome, openPlayer } from "@/utils/navigation";

export default function MovieDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);
  const movie = Number.isFinite(id) ? getMovieById(id) : null;

  if (!movie) {
    return (
      <>
        <StatusBar style="dark" />
        <ScreenMessage
          icon="movie"
          title="Filme não encontrado"
          description="O título que você tentou abrir não existe ou saiu do catálogo."
          actionLabel="VOLTAR"
          onAction={goBackOrHome}
        />
      </>
    );
  }

  return <MovieDetailsContent movie={movie} />;
}

function MovieDetailsContent({ movie }: { movie: Movie }) {
  const insets = useSafeAreaInsets();
  const [inList, setInList] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  const refreshInList = useCallback(async () => {
    try {
      setInList(await isFilmeEmAlgumaLista(USUARIO_DEMO_ID, movie.id));
    } catch {
      setInList(false);
    }
  }, [movie.id]);

  useFocusEffect(
    useCallback(() => {
      refreshInList();
    }, [refreshInList]),
  );

  async function shareMovie() {
    try {
      await Share.share({
        message: `${movie.title} (${movie.year}) — assista na Luly`,
      });
    } catch {
      showNotice("Não foi possível compartilhar agora.");
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { marginTop: insets.top + 8 }]}>
          <Image
            source={{ uri: movie.hero }}
            style={styles.heroImage}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.heroScrim} />
          <View style={styles.topBar}>
            <Pressable
              onPress={goBackOrHome}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.pressed,
              ]}
            >
              <MaterialIcons name="arrow-back" size={22} color={Brand.paper} />
            </Pressable>
            <Pressable
              onPress={shareMovie}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.pressed,
              ]}
            >
              <MaterialIcons name="share" size={20} color={Brand.paper} />
            </Pressable>
          </View>
          <View style={styles.heroContent}>
            {movie.isOriginal ? (
              <View style={styles.originalBadge}>
                <Text style={styles.originalText}>ORIGINAL LULY</Text>
              </View>
            ) : null}
            <View style={styles.ratingRow}>
              <MaterialIcons name="star" size={18} color={Brand.yellow} />
              <Text style={styles.ratingText}>
                {formatRating(movie.rating)}
              </Text>
            </View>
            <Text style={styles.title}>{movie.title}</Text>
            <Text style={styles.metaLine}>
              {movie.year} • {formatDuration(movie.durationMin)} •{" "}
              {movie.maturity} • {movie.genre}
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <HardShadow
            offset={5}
            radius={8}
            containerStyle={styles.watchWrapper}
            style={styles.watchButton}
          >
            <Pressable
              onPress={() => openPlayer(movie.id)}
              style={({ pressed }) => [
                styles.watchPress,
                pressed && styles.pressed,
              ]}
            >
              <MaterialIcons
                name="play-circle-filled"
                size={22}
                color={Brand.paper}
              />
              <Text style={styles.watchLabel}>ASSISTIR AGORA</Text>
            </Pressable>
          </HardShadow>
          <View style={styles.toggleColumn}>
            <Pressable
              onPress={() => setSheetVisible(true)}
              style={({ pressed }) => [
                styles.toggleButton,
                inList && styles.toggleButtonActive,
                pressed && styles.pressed,
              ]}
            >
              <MaterialIcons
                name={inList ? "check" : "add"}
                size={24}
                color={inList ? Brand.paper : Brand.ink}
              />
            </Pressable>
            <Text style={styles.toggleLabel}>Na lista</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.sectionTitle}>Sinopse</Text>
          <Text style={styles.synopsis}>{movie.synopsis}</Text>

          <View style={styles.directionRow}>
            <Text style={styles.directionLabel}>Direção</Text>
            <Text style={styles.directionValue}>{movie.director}</Text>
            <Text style={styles.directionExtra}>• Áudio 5.1</Text>
            <Text style={styles.directionExtra}>• CC</Text>
          </View>

          <Text style={[styles.sectionTitle, styles.castTitle]}>
            Elenco principal
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.castRow}
          >
            {movie.cast.map((member) => (
              <View key={member.name} style={styles.castCard}>
                <Image
                  source={{ uri: member.avatar }}
                  style={styles.castAvatar}
                  contentFit="cover"
                />
                <Text style={styles.castName} numberOfLines={1}>
                  {member.name}
                </Text>
                <Text style={styles.castRole} numberOfLines={1}>
                  {member.role}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <AddToListSheet
        movie={sheetVisible ? movie : null}
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onChanged={refreshInList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.canvas,
  },
  scroll: {
    paddingBottom: 40,
  },
  hero: {
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Brand.black,
    height: 420,
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
  },
  heroScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  topBar: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroContent: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 18,
    gap: 6,
  },
  originalBadge: {
    alignSelf: "flex-start",
    backgroundColor: Brand.red,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: Brand.black,
  },
  originalText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: Brand.paper,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "900",
    color: Brand.paper,
  },
  title: {
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "900",
    color: Brand.paper,
  },
  metaLine: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.85)",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  watchWrapper: {
    flex: 1,
  },
  watchButton: {
    backgroundColor: Brand.red,
    borderRadius: 8,
  },
  watchPress: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 17,
  },
  watchLabel: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: Brand.paper,
  },
  toggleColumn: {
    alignItems: "center",
    gap: 4,
  },
  toggleButton: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Brand.black,
    backgroundColor: Brand.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleButtonActive: {
    backgroundColor: Brand.red,
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: Brand.ink,
  },
  body: {
    paddingHorizontal: 20,
    marginTop: 28,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: Brand.ink,
  },
  synopsis: {
    fontSize: 15,
    lineHeight: 23,
    color: "#3A3A3D",
  },
  directionRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  directionLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: Brand.ink,
  },
  directionValue: {
    fontSize: 13,
    color: Brand.muted,
  },
  directionExtra: {
    fontSize: 13,
    color: Brand.muted,
  },
  castTitle: {
    marginTop: 16,
  },
  castRow: {
    gap: 14,
    paddingTop: 4,
    paddingBottom: 6,
  },
  castCard: {
    width: 88,
    gap: 4,
  },
  castAvatar: {
    width: 88,
    height: 88,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Brand.black,
    backgroundColor: Brand.canvas,
  },
  castName: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "900",
    color: Brand.ink,
  },
  castRole: {
    fontSize: 11,
    color: Brand.muted,
  },
  pressed: {
    opacity: 0.85,
  },
});
