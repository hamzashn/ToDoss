import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

import * as repo from '@/db/settings';
import { cancelAllReminders, rescheduleAllReminders } from '@/notifications';
import type { Settings } from '@/types';
import { events } from '@/utils/events';

import { useDbQuery } from './useDbQuery';

export function useSettings() {
  const db = useSQLiteContext();
  const result = useDbQuery(['settings'], repo.getSettings);

  const set = useCallback(
    async <K extends keyof Settings>(key: K, value: Settings[K]) => {
      await repo.setSetting(db, key, value);
      events.emit('settings');
      // Bildirimler açılıp kapanınca planlı hatırlatıcılar buna uyar
      if (key === 'notificationsEnabled') {
        await (value ? rescheduleAllReminders(db) : cancelAllReminders(db));
      }
    },
    [db],
  );

  const resetAll = useCallback(async () => {
    await cancelAllReminders(db);
    await repo.resetAll(db);
    events.emit('tasks', 'categories', 'settings');
  }, [db]);

  return { ...result, settings: result.data, set, resetAll };
}
