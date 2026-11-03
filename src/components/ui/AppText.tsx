import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { colors, fonts, typography, type FontWeight, type TypographyVariant } from '@/theme';

export type AppTextProps = TextProps & {
  variant?: TypographyVariant;
  color?: string;
  weight?: FontWeight;
  align?: TextStyle['textAlign'];
};

export function AppText({
  variant = 'body',
  color = colors.text,
  weight,
  align,
  style,
  maxFontSizeMultiplier = 1.3,
  ...rest
}: AppTextProps) {
  const v = typography[variant];

  return (
    <Text
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[
        styles.base,
        {
          fontSize: v.fontSize,
          lineHeight: v.lineHeight,
          fontFamily: fonts[weight ?? v.weight],
          color,
          textAlign: align,
        },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  // Android'de özel fontlarda fazladan üst boşluğu önler
  base: { includeFontPadding: false },
});
