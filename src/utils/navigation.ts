import { router } from 'expo-router';

export function goBackOrHome() {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace('/(tabs)/inicio');
}

export function openMovie(id: number) {
  router.push({ pathname: '/movie/[id]', params: { id: String(id) } });
}

export function openPlayer(id: number) {
  router.push({ pathname: '/player/[id]', params: { id: String(id) } });
}
