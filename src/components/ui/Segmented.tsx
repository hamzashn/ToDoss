import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, shadows, spacing } from '@/theme';

import { AppText } from './AppText';

export type SegmentOption<T extends string | number> = {
  value: T;
  label: string;
  /** Etiketin solundaki renkli nokta (öncelik seçimi) */
  dot?: string;
};

type Props<T extends string | number> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  compact?: boolean;
};

export function Segmented<T extends string | number>({ options, value, onChange, compact }: Props<T>) {
  return (
    <View style={[styles.track, compact && styles.trackCompact]} accessibilityRole="tablist">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[styles.item, compact && styles.itemCompact, selected && styles.itemSelected]}
          >
            {o.dot ? <View style={[styles.dot, { backgroundColor: o.dot }]} /> : null}
            <AppText
              variant="label"
              color={selected ? colors.text : colors.textSecondary}
              // Kompakt (içeriğe göre genişleyen) modda satır kısıtı genişliği sıfırlıyor
              numberOfLines={compact ? undefined : 1}
            >
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.track,
  },
  trackCompact: { alignSelf: 'flex-start' },
  item: {
    flex: 1,
    height: 44,
    borderRadius: radius.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  // flex: 0 web'de genişliği sıfırlıyor; içeriğe göre boyutlanma açıkça belirtilir
  itemCompact: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', minWidth: 64, height: 40, paddingHorizontal: spacing.lg },
  itemSelected: { backgroundColor: colors.surface, ...shadows.card },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
