import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useResponsive } from '@/hooks/useResponsive';
import { colors, radius, readableOn, shadows, spacing, tintOnWhite } from '@/theme';
import type { TaskWithCategory } from '@/types';

import { AppText } from './ui/AppText';

type Palette = { background: string; title: string; subtitle: string; bordered?: boolean };

/** Takvim kartı renk kuralı (TODOSS.md §8.4) */
export function timelinePalette(task: TaskWithCategory): Palette {
  if (task.priority === 2 && !task.completed) {
    return { background: colors.primary, title: colors.white, subtitle: 'rgba(255,255,255,0.85)' };
  }
  switch (task.categorySlug) {
    case 'work':
      return { background: colors.primaryLight, title: colors.text, subtitle: colors.textSecondary };
    case 'shopping':
      return { background: colors.accentLight, title: colors.accentDark, subtitle: colors.accentText };
    case 'health':
      return { background: colors.successLight, title: colors.successDark, subtitle: colors.successText };
    case 'personal':
      return { background: colors.surface, title: colors.text, subtitle: colors.textSecondary, bordered: true };
    default: {
      // Kullanıcının eklediği kategoriler: kendi renginin açık tonu, alt metin okunur tonda
      const background = tintOnWhite(task.categoryColor, 0.14);
      return { background, title: colors.text, subtitle: readableOn(task.categoryColor, background) };
    }
  }
}

/** "İş · Önemli" / "Kişisel · Sahil yolu" / "Alışveriş" */
export function timelineSubtitle(task: TaskWithCategory): string {
  if (task.priority === 2) return `${task.categoryName} · Önemli`;
  const firstLine = task.note?.split('\n')[0].trim();
  return firstLine ? `${task.categoryName} · ${firstLine}` : task.categoryName;
}

type Props = {
  task: TaskWithCategory;
  onPress: (task: TaskWithCategory) => void;
  onLongPress: (task: TaskWithCategory) => void;
};

export const TimelineItem = memo(function TimelineItem({ task, onPress, onLongPress }: Props) {
  const { s } = useResponsive();
  const palette = timelinePalette(task);

  return (
    <View style={styles.row}>
      <View style={[styles.times, { width: s(56) }]}>
        <AppText variant="title" numberOfLines={1} adjustsFontSizeToFit>
          {task.startTime ?? '—'}
        </AppText>
        {task.endTime ? (
          <AppText variant="caption" color={colors.textMuted} numberOfLines={1}>
            {task.endTime}
          </AppText>
        ) : null}
      </View>
      <Pressable
        onPress={() => onPress(task)}
        onLongPress={() => onLongPress(task)}
        delayLongPress={350}
        accessibilityRole="button"
        accessibilityLabel={`${task.startTime ?? 'Saatsiz'}, ${task.title}, ${timelineSubtitle(task)}${
          task.completed ? ', tamamlandı' : ''
        }`}
        accessibilityHint="Düzenlemek için dokun, seçenekler için basılı tut"
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: palette.background },
          palette.bordered && styles.bordered,
          task.completed && styles.completed,
          pressed && styles.pressed,
        ]}
      >
        <AppText
          variant="title"
          color={palette.title}
          numberOfLines={2}
          style={task.completed && styles.strike}
        >
          {task.title}
        </AppText>
        <AppText variant="caption" color={palette.subtitle} numberOfLines={1}>
          {timelineSubtitle(task)}
        </AppText>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  times: { paddingTop: spacing.lg, gap: 2 },
  card: {
    flex: 1,
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
  },
  bordered: { borderWidth: 1, borderColor: colors.border, ...shadows.card },
  completed: { opacity: 0.55 },
  pressed: { opacity: 0.8 },
  strike: { textDecorationLine: 'line-through' },
});
