import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useTheme } from '@/contexts/theme-context';
import { FontFamily } from '@/constants/typography';

export default function AppTabs() {
  const theme = useTheme();

  return (
    <NativeTabs
      backgroundColor={theme.tabBar}
      tintColor={theme.accent}
      iconColor={{ default: theme.textMuted, selected: theme.accent }}
      labelStyle={{
        default: { color: theme.textMuted, fontSize: 11, fontFamily: FontFamily.bold },
        selected: { color: theme.accent, fontSize: 11, fontFamily: FontFamily.bold },
      }}
      disableTransparentOnScrollEdge>
      <NativeTabs.Trigger name="inicio">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        <NativeTabs.Trigger.Label>Início</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="buscar">
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
        <NativeTabs.Trigger.Label>Buscar</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="minha-lista">
        <NativeTabs.Trigger.Icon sf={{ default: 'bookmark', selected: 'bookmark.fill' }} md="bookmark" />
        <NativeTabs.Trigger.Label>Listas</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
