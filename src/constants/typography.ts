import type { TextStyle } from 'react-native';

export const FontFamily = {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_500Medium',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
} as const;

export const TypeScale = {
  display: { fontSize: 38, lineHeight: 46 },
  screenTitle: { fontSize: 32, lineHeight: 38 },
  heroTitle: { fontSize: 34, lineHeight: 40 },
  playerTitle: { fontSize: 24, lineHeight: 30 },
  modalTitle: { fontSize: 23, lineHeight: 29 },
  cardHeadline: { fontSize: 28, lineHeight: 34 },
  sectionTitle: { fontSize: 21, lineHeight: 27 },
  resultsTitle: { fontSize: 24, lineHeight: 30 },
  emptyTitle: { fontSize: 20, lineHeight: 26 },
  listTitle: { fontSize: 18, lineHeight: 24 },
  cardTitle: { fontSize: 16, lineHeight: 21 },
  cardTitleSmall: { fontSize: 15, lineHeight: 20 },
  bodyLarge: { fontSize: 15, lineHeight: 22 },
  body: { fontSize: 14, lineHeight: 20 },
  subtitle: { fontSize: 13, lineHeight: 18 },
  caption: { fontSize: 12, lineHeight: 16 },
  label: { fontSize: 11, lineHeight: 15 },
  micro: { fontSize: 10, lineHeight: 13 },
  button: { fontSize: 13, lineHeight: 18 },
  buttonLarge: { fontSize: 14, lineHeight: 19 },
} as const satisfies Record<string, Pick<TextStyle, 'fontSize' | 'lineHeight'>>;
