import * as ScreenOrientation from 'expo-screen-orientation';

export type OrientationLock =
  | 'PORTRAIT_UP'
  | 'PORTRAIT_DOWN'
  | 'LANDSCAPE'
  | 'LANDSCAPE_LEFT'
  | 'LANDSCAPE_RIGHT'
  | 'UNLOCK';

export async function lockOrientation(lock: OrientationLock): Promise<void> {
  try {
    await ScreenOrientation.lockAsync(lock as any);
  } catch {
    // Ignorar falhas de orientação (ex.: web ou device sem suporte).
  }
}

export async function unlockOrientation(): Promise<void> {
  try {
    await ScreenOrientation.unlockAsync();
  } catch {
    // Ignorar falhas de orientação.
  }
}