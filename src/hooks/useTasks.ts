import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { useCallback } from 'react';

import * as repo from '@/db/tasks';
import { cancelTaskReminder, syncTaskReminder } from '@/notifications';
import type { TaskInput } from '@/types';
import { events } from '@/utils/events';

import { useDbQuery } from './useDbQuery';

/** Bir günün görevleri; categoryId verilirse filtrelenir */
export function useTasks(date: string, categoryId?: number | null) {
  const query = useCallback(
    (db: SQLiteDatabase) => repo.getTasksByDate(db, date, categoryId),
    [date, categoryId],
  );
  const result = useDbQuery(['tasks', 'categories'], query);
  return { ...result, tasks: result.data ?? [] };
}

/** Tarih aralığındaki gün başına görev sayısı (takvim noktaları) */
export function useTaskCounts(from: string, to: string) {
  const query = useCallback(
    (db: SQLiteDatabase) => repo.getTaskCountsInRange(db, from, to),
    [from, to],
  );
  const result = useDbQuery(['tasks'], query);
  return { ...result, counts: result.data ?? {} };
}

export function useTask(id: number) {
  const query = useCallback(
    (db: SQLiteDatabase) => repo.getTaskById(db, id),
    [id],
  );
  const result = useDbQuery(['tasks', 'categories'], query);
  return { ...result, task: result.data ?? null };
}

/** Hatırlatıcısı açık, henüz başlamamış görevler (zil ikonu ve hatırlatıcılar ekranı) */
export function useUpcomingReminders() {
  const query = useCallback((db: SQLiteDatabase) => repo.getUpcomingReminders(db), []);
  const result = useDbQuery(['tasks', 'categories'], query);
  return { ...result, reminders: result.data ?? [] };
}

/**
 * Görev yazma işlemleri. Her biri 'tasks' kanalını tetikler, ardından
 * hatırlatıcıyı arka planda senkronlar (arayüz bildirim planlamasını beklemez).
 */
export function useTaskActions() {
  const db = useSQLiteContext();

  const changed = useCallback(
    (id: number) => {
      events.emit('tasks');
      syncTaskReminder(db, id).catch(() => {});
    },
    [db],
  );

  return {
    create: useCallback(
      async (input: TaskInput) => {
        const id = await repo.createTask(db, input);
        changed(id);
        return id;
      },
      [db, changed],
    ),
    update: useCallback(
      async (id: number, input: TaskInput) => {
        await repo.updateTask(db, id, input);
        changed(id);
      },
      [db, changed],
    ),
    setCompleted: useCallback(
      async (id: number, completed: boolean) => {
        await repo.setTaskCompleted(db, id, completed);
        changed(id);
      },
      [db, changed],
    ),
    moveToDate: useCallback(
      async (id: number, date: string) => {
        await repo.moveTaskToDate(db, id, date);
        changed(id);
      },
      [db, changed],
    ),
    remove: useCallback(
      async (id: number) => {
        // Bildirim id'si satırda; önce iptal, sonra sil
        await cancelTaskReminder(db, id).catch(() => {});
        await repo.deleteTask(db, id);
        events.emit('tasks');
      },
      [db],
    ),
  };
}
