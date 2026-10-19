import { Text as NativeText, StyleSheet, type TextProps } from 'react-native';

import { FontFamily } from '@/constants/typography';

const familyByWeight: Record<string, string> = {
  '100': FontFamily.regular,
  '200': FontFamily.regular,
  '300': FontFamily.regular,
  '400': FontFamily.regular,
  normal: FontFamily.regular,
  '500': FontFamily.medium,
  '600': FontFamily.semibold,
  '700': FontFamily.bold,
  bold: FontFamily.bold,
  '800': FontFamily.extrabold,
  '900': FontFamily.black,
};

export function Text({ style, ...props }: TextProps) {
  const flattened = StyleSheet.flatten(style);
  const weight = flattened?.fontWeight;
  const fontFamily =
    flattened?.fontFamily ??
    (weight !== undefined ? familyByWeight[String(weight)] : undefined) ??
    FontFamily.regular;

  return (
    <NativeText
      {...props}
      style={[style, { fontFamily, fontWeight: 'normal' }]}
    />
  );
}
