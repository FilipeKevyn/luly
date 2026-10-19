import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { Brand } from '@/constants/theme';
import { FontFamily } from '@/constants/typography';

export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={Brand.paper}
      tintColor={Brand.red}
      iconColor={{ default: Brand.muted, selected: Brand.red }}
      labelStyle={{
        default: { color: Brand.muted, fontSize: 11, fontFamily: FontFamily.bold },
        selected: { color: Brand.red, fontSize: 11, fontFamily: FontFamily.bold },
      }}
      disableTransparentOnScrollEdge>
      <NativeTabs.Trigger name="inicio">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        <NativeTabs.Trigger.Label>Início</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="minha-lista">
        <NativeTabs.Trigger.Icon sf={{ default: 'bookmark', selected: 'bookmark.fill' }} md="bookmark" />
        <NativeTabs.Trigger.Label>Listas</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
