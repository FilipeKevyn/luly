import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Brand } from '@/constants/theme';

type HardShadowProps = PropsWithChildren<{
  offset?: number;
  radius?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}>;

export function HardShadow({
  children,
  offset = 5,
  radius = 0,
  color = Brand.black,
  style,
  containerStyle,
}: HardShadowProps) {
  return (
    <View style={containerStyle}>
      <View
        pointerEvents="none"
        style={[
          styles.layer,
          { top: offset, left: offset, right: -offset, bottom: -offset, backgroundColor: color, borderRadius: radius },
        ]}
      />
      <View style={style}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
  },
});
