import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

import * as repo from '@/db/categories';
import { getScheduledTaskIdsByCategory } from '@/db/tasks';
import { syncTaskReminders } from '@/notifications';
import type { CategoryInput } from '@/types';
import { events } from '@/utils/events';

import { useDbQuery } from './useDbQuery';

export function useCategories() {
  const db = useSQLiteContext();
  const result = useDbQuery(['categories', 'tasks'], repo.getCategories);

  const create = useCallback(
    async (input: CategoryInput) => {
      const id = await repo.createCategory(db, input);
      events.emit('categories');
      return id;
    },
    [db],
  );

  const update = useCallback(
    async (id: number, input: CategoryInput) => {
      await repo.updateCategory(db, id, input);
      events.emit('categories');
      // Bildirim metninde kategori adı geçiyor
      const ids = await getScheduledTaskIdsByCategory(db, id);
      syncTaskReminders(db, ids).catch(() => {});
    },
    [db],
  );

  /** @returns Kişisel'e taşınan görevlerin id'leri */
  const remove = useCallback(
    async (id: number) => {
      const movedTaskIds = await repo.deleteCategory(db, id);
      events.emit('categories', 'tasks');
      syncTaskReminders(db, movedTaskIds).catch(() => {});
      return movedTaskIds;
    },
    [db],
  );

  return { ...result, categories: result.data ?? [], create, update, remove };
}
