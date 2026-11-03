import { router } from 'expo-router';
import { useCallback, useState } from 'react';

import { useTaskActions } from '@/hooks/useTasks';
import type { TaskWithCategory } from '@/types';
import { addDays, parseISODate, toISODate } from '@/utils/date';

import { ActionSheet } from './ui/ActionSheet';
import { useDialog } from './ui/Dialog';

export function openTaskEditor(task: { id: number }) {
  router.push({ pathname: '/task/[id]', params: { id: String(task.id) } });
}

/**
 * Görev satırına basılı tutunca açılan menü (tamamla, düzenle, ertele, sil).
 * `onToggle` verilmezse doğrudan DB güncellenir.
 */
export function useTaskMenu(onToggle?: (task: TaskWithCategory) => void) {
  const { setCompleted, moveToDate, remove } = useTaskActions();
  const { show, dialog } = useDialog();
  // Görev kapanış animasyonu boyunca korunur; açık/kapalı ayrı tutulur
  const [task, setTask] = useState<TaskWithCategory | null>(null);
  const [open, setOpen] = useState(false);

  const failed = (title: string) => () => show({ title, message: 'Tekrar deneyin.', tone: 'warning' });

  const toggle = (t: TaskWithCategory) =>
    onToggle ? onToggle(t) : setCompleted(t.id, !t.completed).catch(failed('Görev güncellenemedi'));

  const confirmDelete = (t: TaskWithCategory) =>
    show({
      title: 'Görev silinsin mi?',
      message: `"${t.title}" kalıcı olarak silinecek.`,
      actions: [
        { label: 'Vazgeç', style: 'cancel' },
        { label: 'Sil', style: 'destructive', onPress: () => remove(t.id).catch(failed('Görev silinemedi')) },
      ],
    });

  const menu = (
    <>
      <ActionSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={task?.title}
        items={
          task
            ? [
                {
                  label: task.completed ? 'Tamamlanmadı olarak işaretle' : 'Tamamlandı olarak işaretle',
                  icon: task.completed ? 'rotate-ccw' : 'check-circle',
                  onPress: () => toggle(task),
                },
                { label: 'Düzenle', icon: 'edit-2', onPress: () => openTaskEditor(task) },
                {
                  label: task.date === toISODate(new Date()) ? 'Yarına ertele' : 'Bir gün ertele',
                  icon: 'arrow-right-circle',
                  onPress: () => moveToDate(task.id, toISODate(addDays(parseISODate(task.date), 1))),
                },
                { label: 'Sil', icon: 'trash-2', destructive: true, onPress: () => confirmDelete(task) },
              ]
            : []
        }
      />
      {dialog}
    </>
  );

  // Sabit referans: TaskItem/TimelineItem memo'su bozulmasın
  const openMenu = useCallback((t: TaskWithCategory) => {
    setTask(t);
    setOpen(true);
  }, []);

  return { openMenu, menu };
}
