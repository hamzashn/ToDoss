import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { TaskForm, defaultTaskInput } from '@/components/TaskForm';
import { useCategories } from '@/hooks/useCategories';
import { useSettings } from '@/hooks/useSettings';
import { useTaskActions } from '@/hooks/useTasks';
import type { Settings } from '@/types';

export default function NewTaskScreen() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  const { categories } = useCategories();
  const { settings } = useSettings();

  // Kategoriler ve ayarlar yüklenince form bir kez kurulur
  if (!settings || categories.length === 0) return null;
  return <NewTaskForm date={date} categoryId={categories[0].id} settings={settings} />;
}

function NewTaskForm({ date, categoryId, settings }: { date?: string; categoryId: number; settings: Settings }) {
  const { create } = useTaskActions();
  const [initial] = useState(() =>
    defaultTaskInput({
      date: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined,
      categoryId,
      reminderEnabled: settings.notificationsEnabled,
      reminderMinutes: settings.defaultReminderMinutes,
    }),
  );

  return (
    <TaskForm
      mode="create"
      initial={initial}
      onSubmit={async (input) => {
        await create(input);
      }}
    />
  );
}
