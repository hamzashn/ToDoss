import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { AppText } from './AppText';

type Props = {
  label?: string;
  selected?: boolean;
  /** Seçiliyken lacivert zemin ("Tümü" filtresi) */
  dark?: boolean;
  /** Kesik kenarlı "+" ekleme chip'i */
  dashed?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
};

export function Chip({ label, selected, dark, dashed, onPress, accessibilityLabel }: Props) {
  const selectedBg = dark ? colors.chipDark : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => [
        styles.base,
        dashed && styles.dashed,
        selected && { backgroundColor: selectedBg, borderColor: selectedBg },
        pressed && !selected && styles.pressed,
      ]}
    >
      {dashed ? (
        <Feather name="plus" size={18} color={colors.primary} />
      ) : (
        <AppText variant="label" color={selected ? colors.white : colors.text} numberOfLines={1}>
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 44,
    minWidth: 44,
    paddingHorizontal: spacing.lg + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashed: {
    paddingHorizontal: 0,
    width: 44,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  pressed: { backgroundColor: colors.primarySoft },
});
