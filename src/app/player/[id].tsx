import { MaterialIcons } from '@expo/vector-icons';
import { useEvent, useEventListener } from 'expo';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { VideoView, useVideoPlayer, type VideoPlayer } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HardShadow } from '@/components/hard-shadow';
import { ScreenMessage } from '@/components/screen-message';
import { Text } from '@/components/text';
import { Brand } from '@/constants/theme';
import { TypeScale } from '@/constants/typography';
import { getMovieById, getNextMovie, type Movie } from '@/data/movies';
import { marcarFinalizado, marcarIniciado, USUARIO_DEMO_ID } from '@/db/repositories';
import { showNotice } from '@/utils/feedback';
import { formatClock, formatDuration, formatRemaining, formatWatched } from '@/utils/format';
import { goBackOrHome } from '@/utils/navigation';

const RATES = [1, 1.5, 2];

export default function PlayerScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);
  const movie = Number.isFinite(id) ? getMovieById(id) : null;

  if (!movie) {
    return (
      <>
        <StatusBar style="light" />
        <ScreenMessage
          icon="movie"
          title="Vídeo indisponível"
          description="Não encontramos este título no catálogo."
          actionLabel="VOLTAR"
          onAction={goBackOrHome}
        />
      </>
    );
  }

  return <PlayerContent key={movie.id} movie={movie} />;
}

function PlayerContent({ movie }: { movie: Movie }) {
  const insets = useSafeAreaInsets();
  const videoRef = useRef<VideoView>(null);
  const playerRef = useRef<VideoPlayer | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rateIndex, setRateIndex] = useState(0);
  const [barWidth, setBarWidth] = useState(0);

  const player = useVideoPlayer(movie.videoUrl, (instance) => {
    playerRef.current = instance;
    instance.timeUpdateEventInterval = 0.5;
    instance.play();
  });

  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  const nextMovie = getNextMovie(movie.id);

  useEventListener(player, 'timeUpdate', ({ currentTime: time }) => {
    setCurrentTime(time);
  });

  useEventListener(player, 'sourceLoad', ({ duration: seconds }) => {
    setDuration(seconds);
  });

  useEventListener(player, 'playToEnd', () => {
    marcarFinalizado(USUARIO_DEMO_ID, movie.id).catch(() => {});
  });

  useEffect(() => {
    marcarIniciado(USUARIO_DEMO_ID, movie.id).catch(() => {});
  }, [movie.id]);

  const displayDuration = duration > 0 ? duration : movie.durationMin * 60;
  const progress = displayDuration > 0 ? Math.min(1, currentTime / displayDuration) : 0;
  const rate = RATES[rateIndex];

  function togglePlay() {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  }

  function seekBy(seconds: number) {
    player.seekBy(seconds);
  }

  function seekTo(ratio: number) {
    if (displayDuration <= 0) {
      return;
    }
    const instance = playerRef.current;
    if (!instance) {
      return;
    }
    instance.currentTime = Math.max(0, Math.min(1, ratio)) * displayDuration;
  }

  function cycleRate() {
    const nextIndex = (rateIndex + 1) % RATES.length;
    setRateIndex(nextIndex);
    const instance = playerRef.current;
    if (instance) {
      instance.playbackRate = RATES[nextIndex];
    }
  }

  function retry() {
    player
      .replaceAsync(movie.videoUrl)
      .then(() => {
        player.play();
      })
      .catch(() => {
        showNotice('Não foi possível recarregar o vídeo.');
      });
  }

  function closePlayer() {
    player.pause();
    goBackOrHome();
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={closePlayer} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <MaterialIcons name="close" size={24} color={Brand.paper} />
        </Pressable>
        <Text style={styles.castLabel}>Reproduzindo na TV da sala</Text>
        <Pressable
          onPress={() => showNotice('Transmissão para TV em breve.')}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <MaterialIcons name="cast" size={22} color={Brand.paper} />
        </Pressable>
      </View>

      <View style={styles.videoBox}>
        <VideoView
          ref={videoRef}
          player={player}
          style={styles.video}
          nativeControls={false}
          contentFit="contain"
          playsInline
        />

        {status === 'error' ? (
          <View style={styles.videoOverlay}>
            <Text style={styles.errorTitle}>Não foi possível reproduzir</Text>
            <Text style={styles.errorDescription}>
              Verifique sua conexão e tente novamente.
            </Text>
            <View style={styles.errorActions}>
              <Pressable onPress={retry} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
                <Text style={styles.retryLabel}>TENTAR NOVAMENTE</Text>
              </Pressable>
              <Pressable onPress={closePlayer} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
                <Text style={styles.backLabel}>VOLTAR</Text>
              </Pressable>
            </View>
          </View>
        ) : status === 'loading' ? (
          <View style={styles.videoOverlay} pointerEvents="none">
            <ActivityIndicator color={Brand.paper} size="large" />
          </View>
        ) : (
          <View style={styles.centerControls} pointerEvents="box-none">
            <Pressable
              onPress={() => seekBy(-10)}
              style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}>
              <MaterialIcons name="replay-10" size={28} color={Brand.paper} />
            </Pressable>
            <HardShadow offset={5} radius={10} style={styles.playButton}>
              <Pressable
                onPress={togglePlay}
                style={({ pressed }) => [styles.playPress, pressed && styles.pressed]}>
                <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={38} color={Brand.paper} />
              </Pressable>
            </HardShadow>
            <Pressable
              onPress={() => seekBy(10)}
              style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}>
              <MaterialIcons name="forward-10" size={28} color={Brand.paper} />
            </Pressable>
          </View>
        )}

        <View style={styles.progressArea} pointerEvents="box-none">
          <View style={styles.timesRow}>
            <Text style={styles.timeText}>{formatClock(currentTime)}</Text>
            <Text style={styles.timeRest}>{formatRemaining(Math.max(0, displayDuration - currentTime))}</Text>
          </View>
          <Pressable
            onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
            onPress={(event) => seekTo(event.nativeEvent.locationX / (barWidth || 1))}
            style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            <View style={[styles.progressThumb, { left: `${progress * 100}%` }]} />
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.info} contentContainerStyle={styles.infoContent}>
        <View style={styles.controlsRow}>
          <Pressable
            onPress={() => showNotice('Áudio e legendas em breve.')}
            style={({ pressed }) => [styles.controlChip, pressed && styles.pressed]}>
            <MaterialIcons name="subtitles" size={16} color={Brand.paper} />
            <Text style={styles.controlChipLabel}>Áudio e legendas</Text>
          </Pressable>
          <Pressable
            onPress={cycleRate}
            style={({ pressed }) => [styles.controlChip, pressed && styles.pressed]}>
            <MaterialIcons name="speed" size={16} color={Brand.paper} />
            <Text style={styles.controlChipLabel}>{rate}x</Text>
          </Pressable>
          <Pressable
            onPress={() => videoRef.current?.enterFullscreen()}
            style={({ pressed }) => [styles.controlChip, pressed && styles.pressed]}>
            <MaterialIcons name="fullscreen" size={18} color={Brand.paper} />
          </Pressable>
        </View>

        <Text style={styles.movieTitle}>{movie.title}</Text>
        <Text style={styles.movieSub}>
          {movie.tagline} • {formatWatched(currentTime)} de {formatDuration(Math.round(displayDuration / 60))}
        </Text>

        {nextMovie ? (
          <View style={styles.nextSection}>
            <View style={styles.nextHeader}>
              <Text style={styles.nextLabel}>A SEGUIR NA LULY</Text>
              <Text style={styles.nextHint}>em breve</Text>
            </View>
            <Pressable
              onPress={() =>
                router.replace({ pathname: '/player/[id]', params: { id: String(nextMovie.id) } })
              }
              style={({ pressed }) => [styles.nextCard, pressed && styles.pressed]}>
              <Image source={{ uri: nextMovie.poster }} style={styles.nextPoster} contentFit="cover" />
              <View style={styles.nextInfo}>
                <Text style={styles.nextTitle} numberOfLines={1}>
                  {nextMovie.title}
                </Text>
                <Text style={styles.nextMeta}>
                  {nextMovie.genre} • {formatDuration(nextMovie.durationMin)}
                </Text>
              </View>
              <View style={styles.nextPlay}>
                <MaterialIcons name="play-arrow" size={24} color={Brand.paper} />
              </View>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.night,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: Brand.nightSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  castLabel: {
    flex: 1,
    textAlign: 'center',
    ...TypeScale.caption,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.75)',
  },
  videoBox: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Brand.black,
    justifyContent: 'center',
  },
  video: {
    ...StyleSheet.absoluteFill,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
  },
  errorTitle: {
    ...TypeScale.listTitle,
    fontWeight: '900',
    color: Brand.paper,
  },
  errorDescription: {
    ...TypeScale.subtitle,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  errorActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  retryButton: {
    backgroundColor: Brand.red,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: Brand.paper,
  },
  retryLabel: {
    ...TypeScale.button,
    fontWeight: '900',
    letterSpacing: 1,
    color: Brand.paper,
  },
  backButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  backLabel: {
    ...TypeScale.button,
    fontWeight: '900',
    letterSpacing: 1,
    color: Brand.paper,
  },
  centerControls: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  skipButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  playButton: {
    backgroundColor: Brand.red,
    borderRadius: 10,
  },
  playPress: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressArea: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 10,
    gap: 8,
  },
  timesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    ...TypeScale.caption,
    fontWeight: '800',
    color: Brand.paper,
  },
  timeRest: {
    ...TypeScale.caption,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 3,
    backgroundColor: Brand.red,
  },
  progressThumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
    backgroundColor: Brand.paper,
  },
  info: {
    flex: 1,
  },
  infoContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
    gap: 8,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  controlChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Brand.nightLine,
    backgroundColor: Brand.nightSoft,
  },
  controlChipLabel: {
    ...TypeScale.caption,
    fontWeight: '800',
    color: Brand.paper,
  },
  movieTitle: {
    marginTop: 10,
    ...TypeScale.playerTitle,
    fontWeight: '900',
    color: Brand.paper,
  },
  movieSub: {
    ...TypeScale.subtitle,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  nextSection: {
    marginTop: 22,
    gap: 10,
  },
  nextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextLabel: {
    ...TypeScale.caption,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: Brand.paper,
  },
  nextHint: {
    ...TypeScale.caption,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  nextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: Brand.nightSoft,
    borderWidth: 1.5,
    borderColor: Brand.nightLine,
  },
  nextPoster: {
    width: 64,
    height: 44,
    borderRadius: 6,
    backgroundColor: Brand.black,
  },
  nextInfo: {
    flex: 1,
    gap: 3,
  },
  nextTitle: {
    ...TypeScale.cardTitleSmall,
    fontWeight: '900',
    color: Brand.paper,
  },
  nextMeta: {
    ...TypeScale.caption,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  nextPlay: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
