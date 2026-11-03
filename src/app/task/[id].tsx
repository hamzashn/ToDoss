import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { TaskForm } from '@/components/TaskForm';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { useTask, useTaskActions } from '@/hooks/useTasks';
import type { TaskInput, TaskWithCategory } from '@/types';

export default function EditTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { task: current, loading } = useTask(Number(id));
  // Silindikten sonra ekran kapanırken "bulunamadı" görünmesin: son görev saklanır
  const [lastSeen, setLastSeen] = useState<TaskWithCategory | null>(null);
  if (current && current !== lastSeen) setLastSeen(current);
  const task = current ?? lastSeen;

  if (loading && !task) return null;
  if (!task) {
    return (
      <Screen edges={['top', 'bottom']} scroll={false} contentStyle={styles.missing}>
        <EmptyState
          icon="alert-circle"
          title="Görev bulunamadı"
          description="Bu görev silinmiş olabilir."
          action={{ label: 'Geri dön', onPress: () => router.back() }}
        />
      </Screen>
    );
  }
  // key: farklı göreve geçilirse form yeniden kurulur
  return <EditTaskForm key={task.id} task={task} />;
}

function EditTaskForm({ task }: { task: TaskWithCategory }) {
  const { update, remove } = useTaskActions();
  const [initial] = useState<TaskInput>(() => ({
    title: task.title,
    note: task.note,
    date: task.date,
    startTime: task.startTime,
    endTime: task.endTime,
    categoryId: task.categoryId,
    priority: task.priority,
    reminderEnabled: task.reminderEnabled,
    reminderMinutes: task.reminderMinutes,
  }));

  return (
    <TaskForm
      mode="edit"
      initial={initial}
      onSubmit={(input) => update(task.id, input)}
      onDelete={() => remove(task.id)}
    />
  );
}

const styles = StyleSheet.create({
  missing: { justifyContent: 'center' },
});
