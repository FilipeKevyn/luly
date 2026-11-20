import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ============================================
// API CONFIG
// ============================================
//
// Em celular físico ou emulador, "localhost" aponta para o próprio aparelho,
// nunca para o computador que roda o backend. Por isso o host da API é
// inferido a partir do endereço do Metro/Expo dev server (ex.: 192.168.0.10)
// e mantemos alguns fallbacks que são testados em tempo de execução.
//
// É possível sobrescrever com EXPO_PUBLIC_API_URL (em .env ou no app.json).

const DEFAULT_API_PORT = 3333;

interface EnvConfig {
  /** Primeira URL tentada (usada também em mensagens de erro). */
  EXPO_PUBLIC_API_URL: string;
  /** URLs candidatas, em ordem de preferência. */
  EXPO_PUBLIC_API_URLS: string[];
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function readConfiguredApiUrl(): string | null {
  // Acesso direto é necessário para o Expo inlinar EXPO_PUBLIC_* em build time.
  const value =
    Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL ?? process.env.EXPO_PUBLIC_API_URL;

  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function hostFromAuthority(authority: string | null | undefined): string | null {
  if (!authority) {
    return null;
  }

  const value = authority.trim();
  const withoutScheme = value.includes('://')
    ? value.slice(value.indexOf('://') + 3)
    : value;
  const withoutPath = withoutScheme.split('/')[0] ?? '';

  // IPv6 entre colchetes: [::1]:8081
  const ipv6 = withoutPath.match(/^\[([^\]]+)\]/);
  if (ipv6) {
    return ipv6[1];
  }

  const host = withoutPath.split(':')[0];
  return host && host.length > 0 ? host : null;
}

function isLoopbackHost(host: string): boolean {
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '::1'
  );
}

function resolveDevServerHost(): string | null {
  const candidates = [Constants.expoConfig?.hostUri, Constants.linkingUri];

  for (const candidate of candidates) {
    const host = hostFromAuthority(candidate);
    if (host && !isLoopbackHost(host)) {
      return host;
    }
  }

  return null;
}

function resolveApiUrls(): string[] {
  const urls: string[] = [];

  const push = (url: string) => {
    const clean = stripTrailingSlash(url);
    if (!urls.includes(clean)) {
      urls.push(clean);
    }
  };

  const configured = readConfiguredApiUrl();
  if (configured) {
    push(configured);
  }

  // Mesmo host que serve o bundle JS (funciona em celular físico e emulador).
  const devServerHost = resolveDevServerHost();
  if (devServerHost) {
    push(`http://${devServerHost}:${DEFAULT_API_PORT}`);
  }

  // Emulador Android alcança a máquina host em 10.0.2.2.
  if (Platform.OS === 'android') {
    push(`http://10.0.2.2:${DEFAULT_API_PORT}`);
  }

  // Último recurso: localhost (útil com `adb reverse tcp:3333 tcp:3333`).
  push(`http://localhost:${DEFAULT_API_PORT}`);

  return urls;
}

const apiUrls = resolveApiUrls();

export const env: EnvConfig = {
  EXPO_PUBLIC_API_URL: apiUrls[0],
  EXPO_PUBLIC_API_URLS: apiUrls,
};
