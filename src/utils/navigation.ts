import { router } from 'expo-router';

export function goBackOrHome() {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace('/(tabs)/inicio');
}

export function openMovie(id: string) {
  router.push({ pathname: '/movie/[id]', params: { id } });
}

export function openPlayer(id: string) {
  router.push({ pathname: '/player/[id]', params: { id } });
}

export function openList(id: number) {
  router.push({ pathname: '/list/[id]', params: { id: String(id) } });
}
