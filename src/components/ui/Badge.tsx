import { StyleSheet, View } from 'react-native';

import { radius, readableOn, spacing, tintOnWhite } from '@/theme';

import { AppText } from './AppText';

type Props = {
  label: string;
  /** Metin rengi; zemin bu rengin açık tonundan türetilir */
  color: string;
  background?: string;
};

export function Badge({ label, color, background }: Props) {
  const bg = background ?? tintOnWhite(color, 0.12);
  return (
    <View style={[styles.base, { backgroundColor: bg }]}>
      {/* Açık renklerde (ör. Kişisel) metin AA kontrastına koyulaştırılır */}
      <AppText variant="micro" color={readableOn(color, bg)} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm - 4,
  },
});
