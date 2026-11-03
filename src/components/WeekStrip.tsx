import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';

import { useResponsive } from '@/hooks/useResponsive';
import { colors, radius, shadows, spacing } from '@/theme';
import {
  DAYS_LONG,
  DAYS_SHORT,
  MONTHS,
  parseISODate,
  toISODate,
  weekDays,
  weekdayIndex,
} from '@/utils/date';

import { AppText } from './ui/AppText';

type Props = {
  selected: string;
  today: string;
  counts: Record<string, number>;
  onSelect: (date: string) => void;
  /** -1 önceki hafta, +1 sonraki hafta (yatay kaydırma) */
  onSwipe: (direction: -1 | 1) => void;
};

const SWIPE_THRESHOLD = 40;

export function WeekStrip({ selected, today, counts, onSelect, onSwipe }: Props) {
  const { s, isSmall } = useResponsive();
  const days = useMemo(() => weekDays(parseISODate(selected)), [selected]);

  // Yalnızca belirgin yatay hareketlerde devreye girer; dokunmalar gün kartlarına kalır
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 15 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderRelease: (_, g) => {
          if (g.dx > SWIPE_THRESHOLD) onSwipe(-1);
          else if (g.dx < -SWIPE_THRESHOLD) onSwipe(1);
        },
      }),
    [onSwipe],
  );

  return (
    <View style={[styles.row, { gap: isSmall ? spacing.xs : spacing.sm - 2 }]} {...pan.panHandlers}>
      {days.map((d) => {
        const iso = toISODate(d);
        const isSelected = iso === selected;
        const isToday = iso === today;
        const hasTasks = (counts[iso] ?? 0) > 0;
        const textColor = isSelected ? colors.white : colors.text;

        return (
          <Pressable
            key={iso}
            onPress={() => {
              if (!isSelected) Haptics.selectionAsync();
              onSelect(iso);
            }}
            accessibilityRole="button"
            accessibilityLabel={`${d.getDate()} ${MONTHS[d.getMonth()]} ${DAYS_LONG[weekdayIndex(d)]}${
              hasTasks ? `, ${counts[iso]} görev` : ''
            }${isToday ? ', bugün' : ''}`}
            accessibilityState={{ selected: isSelected }}
            style={[styles.day, { height: s(76) }, isSelected && styles.daySelected]}
          >
            <AppText
              variant="caption"
              color={isSelected ? 'rgba(255,255,255,0.85)' : colors.textSecondary}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {DAYS_SHORT[weekdayIndex(d)]}
            </AppText>
            <AppText
              variant="h2"
              weight="extrabold"
              color={isToday && !isSelected ? colors.primary : textColor}
              numberOfLines={1}
            >
              {d.getDate()}
            </AppText>
            <View
              style={[
                styles.dot,
                { backgroundColor: isSelected ? colors.white : colors.primary },
                !hasTasks && styles.dotHidden,
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  day: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: radius.md + 2,
    backgroundColor: colors.background,
  },
  daySelected: { backgroundColor: colors.primary, ...shadows.raised },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  dotHidden: { opacity: 0 },
});
