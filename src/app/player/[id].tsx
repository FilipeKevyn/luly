import { MaterialIcons } from '@expo/vector-icons';
import { useEvent, useEventListener } from 'expo';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { VideoView, useVideoPlayer, type VideoPlayer } from 'expo-video';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedStatusBar } from '@/components/app-status-bar';
import { HardShadow } from '@/components/hard-shadow';
import { ScreenMessage } from '@/components/screen-message';
import { Text } from '@/components/text';
import { ThemeToggle } from '@/components/theme-toggle';
import { Brand, Palettes } from '@/constants/theme';
import { TypeScale } from '@/constants/typography';
import { useAuth } from '@/contexts/auth-context';
import { fetchMovieById } from '@/services/api';
import { toMovie } from '@/services/adapter';
import type { Movie } from '@/data/movies';
import { marcarFinalizado, marcarIniciado, USUARIO_DEMO_ID } from '@/db/repositories';
import { showNotice } from '@/utils/feedback';
import { formatClock, formatDuration, formatRemaining, formatWatched } from '@/utils/format';
import { goBackOrHome } from '@/utils/navigation';
import { lockOrientation, unlockOrientation } from '@/utils/orientation';

const RATES = [1, 1.5, 2];
const CONTROLS_HIDE_DELAY_MS = 3000;
const PlayerColors = Palettes.dark;

export default function PlayerScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const movieId = params.id;
    if (!movieId) {
      setMovie(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function loadMovie() {
      try {
        const item = await fetchMovieById(movieId, token);
        if (!cancelled) {
          setMovie(toMovie(item));
        }
      } catch {
        if (!cancelled) {
          setMovie(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    loadMovie();
    return () => {
      cancelled = true;
    };
  }, [params.id, token]);

  if (loading) {
    return (
      <>
        <ThemedStatusBar />
        <ScreenMessage
          icon="movie"
          title="Carregando..."
          description="Buscando vídeo para reprodução."
          actionLabel=""
          onAction={() => {}}
        />
      </>
    );
  }

  if (!movie) {
    return (
      <>
        <ThemedStatusBar />
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
  const [controlsVisible, setControlsVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const player = useVideoPlayer(movie.videoUrl, (instance) => {
    playerRef.current = instance;
    instance.timeUpdateEventInterval = 0.5;
    instance.play();
  });

  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  useEventListener(player, 'timeUpdate', ({ currentTime: time }) => {
    setCurrentTime(time);
  });

  useEventListener(player, 'sourceLoad', ({ duration: seconds }) => {
    setDuration(seconds);
  });

  useEventListener(player, 'playToEnd', () => {
    marcarFinalizado(USUARIO_DEMO_ID, movie).catch(() => {});
  });

  // Restaurar orientação quando sair do fullscreen
  useEffect(() => {
    if (!fullscreen) return;
    return () => {
      unlockOrientation();
    };
  }, [fullscreen]);

  // Trancar portrait no montar
  useEffect(() => {
    lockOrientation('PORTRAIT_UP');
  }, []);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      hideTimerRef.current = null;
      setControlsVisible(false);
    }, CONTROLS_HIDE_DELAY_MS);
  }, [clearHideTimer]);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    if (playerRef.current?.playing) {
      scheduleHide();
    }
  }, [scheduleHide]);

  // Controles somem sozinhos enquanto o vídeo está rodando e ficam visíveis
  // quando ele está pausado.
  useEffect(() => {
    if (isPlaying) {
      scheduleHide();
    } else {
      clearHideTimer();
      setControlsVisible(true);
    }
    return clearHideTimer;
  }, [isPlaying, scheduleHide, clearHideTimer]);

  useEffect(() => {
    marcarIniciado(USUARIO_DEMO_ID, movie).catch(() => {});
  }, [movie]);

  const displayDuration = duration > 0 ? duration : movie.durationMin * 60;
  const progress = displayDuration > 0 ? Math.min(1, currentTime / displayDuration) : 0;
  const rate = RATES[rateIndex];

  function togglePlay() {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    revealControls();
  }

  function seekBy(seconds: number) {
    player.seekBy(seconds);
    revealControls();
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
    revealControls();
  }

  function cycleRate() {
    const nextIndex = (rateIndex + 1) % RATES.length;
    setRateIndex(nextIndex);
    const instance = playerRef.current;
    if (instance) {
      instance.playbackRate = RATES[nextIndex];
    }
    revealControls();
  }

  function toggleControls() {
    if (controlsVisible) {
      clearHideTimer();
      setControlsVisible(false);
      return;
    }
    revealControls();
  }

  function handlePressFullscreen() {
    setFullscreen(true);
    lockOrientation('LANDSCAPE');
    revealControls();
  }

  function handleExitFullscreen() {
    setFullscreen(false);
    unlockOrientation();
    revealControls();
  }

  function handleClosePlayer() {
    if (fullscreen) {
      handleExitFullscreen();
    }
    player.pause();
    goBackOrHome();
  }

  // Handler para o Pressable de fundo - seek direto pelo tap
  function handleProgressBarPress(event: { nativeEvent: { locationX: number } }) {
    if (barWidth <= 0) return;
    const ratio = event.nativeEvent.locationX / barWidth;
    const targetTime = Math.max(0, Math.min(displayDuration, ratio * displayDuration));
    seekTo(targetTime / displayDuration);
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

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      
      {/* Top bar - hidden in fullscreen */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }, !controlsVisible && styles.controlsHidden]} pointerEvents={controlsVisible ? 'auto' : 'none'}>
        <Pressable onPress={handleClosePlayer} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <MaterialIcons name="close" size={24} color={Brand.white} />
        </Pressable>
        <Text style={styles.castLabel} numberOfLines={1}>
          Reproduzindo na TV da sala
        </Text>
        <View style={styles.topBarActions}>
          <ThemeToggle variant="onMedia" style={styles.themeToggle} />
          <Pressable
            onPress={() => showNotice('Transmissão para TV em breve.')}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <MaterialIcons name="cast" size={22} color={Brand.white} />
          </Pressable>
        </View>
      </View>

      <View style={styles.videoBox}>
        {fullscreen && controlsVisible && (
          <View style={styles.fullscreenExitBar}>
            <Pressable
              onPress={handleExitFullscreen}
              style={({ pressed }) => [styles.exitButton, pressed && styles.pressed]}
              accessibilityLabel="Sair da tela cheia"
            >
              <MaterialIcons name="fullscreen-exit" size={24} color={Brand.white} />
            </Pressable>
          </View>
        )}
        
        <VideoView
          ref={videoRef}
          player={player}
          style={styles.video}
          nativeControls={false}
          contentFit="contain"
          playsInline
        />

        <Pressable
          style={styles.tapLayer}
          onPress={toggleControls}
          accessibilityRole="button"
          accessibilityLabel={controlsVisible ? 'Ocultar controles' : 'Mostrar controles'}
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
              <Pressable onPress={handleClosePlayer} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
                <Text style={styles.backLabel}>VOLTAR</Text>
              </Pressable>
            </View>
          </View>
        ) : status === 'loading' ? (
          <View style={styles.videoOverlay} pointerEvents="none">
            <ActivityIndicator color={Brand.white} size="large" />
          </View>
        ) : (
          <View style={[styles.centerControls, !controlsVisible && styles.controlsHidden]} pointerEvents={controlsVisible ? 'box-none' : 'none'}>
            <Pressable
              onPress={() => seekBy(-10)}
              style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}>
              <MaterialIcons name="replay-10" size={28} color={Brand.white} />
            </Pressable>
            <HardShadow offset={5} radius={10} style={styles.playButton}>
              <Pressable
                onPress={togglePlay}
                style={({ pressed }) => [styles.playPress, pressed && styles.pressed]}>
                <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={38} color={Brand.white} />
              </Pressable>
            </HardShadow>
            <Pressable
              onPress={() => seekBy(10)}
              style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}>
              <MaterialIcons name="forward-10" size={28} color={Brand.white} />
            </Pressable>
          </View>
        )}

        {/* Barra de progresso - tap para seek */}
        <View style={[styles.progressArea, !controlsVisible && styles.controlsHidden]}>
          <View style={styles.timesRow}>
            <Text style={styles.timeText}>{formatClock(currentTime)}</Text>
            <Text style={styles.timeRest}>{formatRemaining(Math.max(0, displayDuration - currentTime))}</Text>
          </View>
          <Pressable
            onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
            onPress={handleProgressBarPress}
            style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            <View style={[styles.progressThumb, { left: `${progress * 100}%` }]} />
          </Pressable>
        </View>
      </View>

      {/* Info - oculto em fullscreen */}
      {!fullscreen && (
        <ScrollView style={styles.info} contentContainerStyle={styles.infoContent}>
          <View style={styles.controlsRow}>
            <Pressable
              onPress={() => showNotice('Áudio e legendas em breve.')}
              style={({ pressed }) => [styles.controlChip, pressed && styles.pressed]}>
              <MaterialIcons name="subtitles" size={16} color={Brand.white} />
              <Text style={styles.controlChipLabel}>Áudio e legendas</Text>
            </Pressable>
            <Pressable
              onPress={cycleRate}
              style={({ pressed }) => [styles.controlChip, pressed && styles.pressed]}>
              <MaterialIcons name="speed" size={16} color={Brand.white} />
              <Text style={styles.controlChipLabel}>{rate}x</Text>
            </Pressable>
            <Pressable
              onPress={handlePressFullscreen}
              style={({ pressed }) => [styles.controlChip, pressed && styles.pressed]}>
              <MaterialIcons name="fullscreen" size={18} color={Brand.white} />
            </Pressable>
          </View>

          <Text style={styles.movieTitle}>{movie.title}</Text>
          <Text style={styles.movieSub}>
            {movie.tagline} • {formatWatched(currentTime)} de {formatDuration(Math.round(displayDuration / 60))}
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PlayerColors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  themeToggle: {
    width: 42,
    height: 42,
    borderRadius: 8,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: PlayerColors.surface,
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
  fullscreenExitBar: {
    position: 'absolute' as const,
    top: 50,
    right: 20,
    zIndex: 10,
  },
  exitButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBox: {
    flex: 1,
    backgroundColor: Brand.black,
    justifyContent: 'center',
  },
  video: {
    ...StyleSheet.absoluteFill,
  },
  tapLayer: {
    ...StyleSheet.absoluteFill,
  },
  controlsHidden: {
    opacity: 0,
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
    color: Brand.white,
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
    borderColor: Brand.white,
  },
  retryLabel: {
    ...TypeScale.button,
    fontWeight: '900',
    letterSpacing: 1,
    color: Brand.white,
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
    color: Brand.white,
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
    color: Brand.white,
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
    alignItems: 'center',
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
    backgroundColor: Brand.white,
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
    borderColor: PlayerColors.borderSubtle,
    backgroundColor: PlayerColors.surface,
  },
  controlChipLabel: {
    ...TypeScale.caption,
    fontWeight: '800',
    color: Brand.white,
  },
  movieTitle: {
    marginTop: 10,
    ...TypeScale.playerTitle,
    fontWeight: '900',
    color: Brand.white,
  },
  movieSub: {
    ...TypeScale.subtitle,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  pressed: {
    opacity: 0.85,
  },
});