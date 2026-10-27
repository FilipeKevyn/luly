import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/contexts/theme-context';

interface HardShadowProps extends PropsWithChildren {
  offset?: number;
  radius?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

export function HardShadow({
  children,
  offset = 5,
  radius = 0,
  color,
  style,
  containerStyle,
}: HardShadowProps) {
  const theme = useTheme();

  return (
    <View style={containerStyle}>
      <View
        pointerEvents="none"
        style={[
          styles.layer,
          {
            top: offset,
            left: offset,
            right: -offset,
            bottom: -offset,
            backgroundColor: color ?? theme.shadow,
            borderRadius: radius,
          },
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
