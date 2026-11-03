import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, radius, shadows, spacing } from '@/theme';
import type { Bar } from '@/utils/stats';

import { AppText } from './ui/AppText';

type Props = { title: string; unit: string; bars: Bar[] };

const MIN_BAR = 8;

export function BarChart({ title, unit, bars }: Props) {
  const { s } = useResponsive();
  const reduceMotion = useReducedMotion();
  const maxHeight = s(110);
  const max = Math.max(1, ...bars.map((b) => b.value));
  const [grow] = useState(() => new Animated.Value(0));

  // Veri değişince (ör. Hafta/Ay geçişi) çubuklar alttan yükselir
  const signature = bars.map((b) => b.value).join(',');
  useEffect(() => {
    if (reduceMotion) {
      grow.setValue(1);
      return;
    }
    grow.setValue(0);
    Animated.timing(grow, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [signature, reduceMotion, grow]);

  return (
    <View
      style={styles.card}
      accessible
      accessibilityLabel={`${title}: ${bars.map((b) => `${b.label} ${b.value}`).join(', ')}`}
    >
      <View style={styles.header}>
        <AppText variant="title">{title}</AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {unit}
        </AppText>
      </View>

      <View style={[styles.chart, { height: maxHeight + 22 }]}>
        {bars.map((b) => (
          <View key={b.label} style={styles.column}>
            <AppText
              variant="micro"
              color={b.highlighted ? colors.primary : colors.textSecondary}
              numberOfLines={1}
            >
              {b.value}
            </AppText>
            <Animated.View
              style={[
                styles.bar,
                {
                  height: grow.interpolate({
                    inputRange: [0, 1],
                    outputRange: [MIN_BAR, Math.max(MIN_BAR, (maxHeight * b.value) / max)],
                  }),
                  backgroundColor: b.highlighted ? colors.primary : colors.primaryLight,
                },
              ]}
            />
          </View>
        ))}
      </View>

      <View style={styles.labels}>
        {bars.map((b) => (
          <AppText
            key={b.label}
            variant="caption"
            color={b.highlighted ? colors.primary : colors.textSecondary}
            weight={b.highlighted ? 'bold' : undefined}
            style={styles.label}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {b.label}
          </AppText>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  column: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: spacing.xs },
  bar: { alignSelf: 'stretch', borderRadius: radius.sm },
  labels: { flexDirection: 'row', gap: spacing.sm, marginTop: -spacing.sm },
  label: { flex: 1, textAlign: 'center' },
});
