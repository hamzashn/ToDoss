import Feather from '@expo/vector-icons/Feather';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, shadows, spacing } from '@/theme';
import type { TaskWithCategory } from '@/types';

import { AppText } from './ui/AppText';
import { Badge } from './ui/Badge';
import { Checkbox } from './ui/Checkbox';

type Props = {
  task: TaskWithCategory;
  onToggle: (task: TaskWithCategory) => void;
  onPress: (task: TaskWithCategory) => void;
  onLongPress: (task: TaskWithCategory) => void;
};

export const TaskItem = memo(function TaskItem({ task, onToggle, onPress, onLongPress }: Props) {
  const done = task.completed;
  const important = task.priority === 2 && !done;

  return (
    <Pressable
      onPress={() => onPress(task)}
      onLongPress={() => onLongPress(task)}
      delayLongPress={350}
      accessibilityRole="button"
      accessibilityHint="Düzenlemek için dokun, seçenekler için basılı tut"
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Checkbox
        checked={done}
        onPress={() => onToggle(task)}
        accessibilityLabel={`${task.title}, ${done ? 'tamamlanmadı olarak işaretle' : 'tamamlandı olarak işaretle'}`}
      />
      <View style={styles.body}>
        <AppText
          variant="title"
          color={done ? colors.textMuted : colors.text}
          style={done && styles.strike}
          numberOfLines={2}
        >
          {task.title}
        </AppText>
        <View style={styles.meta}>
          {task.startTime ? (
            <View style={styles.time}>
              <Feather name="clock" size={12} color={colors.textSecondary} />
              <AppText variant="caption" color={colors.textSecondary}>
                {task.startTime}
              </AppText>
            </View>
          ) : null}
          <Badge label={task.categoryName} color={task.categoryColor} />
        </View>
      </View>
      {important ? <Badge label="Önemli" color={colors.accent} background={colors.accentLight} /> : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md + 2,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  pressed: { backgroundColor: colors.background },
  body: { flex: 1, gap: spacing.xs + 2 },
  strike: { textDecorationLine: 'line-through' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  time: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
