import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

export const fontAssets = {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
};

export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

export type FontWeight = keyof typeof fonts;

type Variant = { fontSize: number; lineHeight: number; weight: FontWeight };

export const typography = {
  display: { fontSize: 30, lineHeight: 36, weight: 'extrabold' },
  h1: { fontSize: 24, lineHeight: 30, weight: 'extrabold' },
  h2: { fontSize: 20, lineHeight: 26, weight: 'bold' },
  stat: { fontSize: 30, lineHeight: 36, weight: 'extrabold' },
  title: { fontSize: 16, lineHeight: 22, weight: 'bold' },
  body: { fontSize: 15, lineHeight: 21, weight: 'medium' },
  label: { fontSize: 14, lineHeight: 18, weight: 'semibold' },
  caption: { fontSize: 12, lineHeight: 16, weight: 'medium' },
  micro: { fontSize: 11, lineHeight: 14, weight: 'semibold' },
} satisfies Record<string, Variant>;

export type TypographyVariant = keyof typeof typography;
