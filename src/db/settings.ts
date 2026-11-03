import type { SQLiteDatabase } from 'expo-sqlite';

import type { Settings } from '@/types';

import { seed } from './seed';

const KEYS: Record<keyof Settings, string> = {
  userName: 'user_name',
  onboardingDone: 'onboarding_done',
  notificationsEnabled: 'notifications_enabled',
  defaultReminderMinutes: 'default_reminder_minutes',
};

export async function getSettings(db: SQLiteDatabase): Promise<Settings> {
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    userName: map.get(KEYS.userName) ?? '',
    onboardingDone: map.get(KEYS.onboardingDone) === '1',
    notificationsEnabled: (map.get(KEYS.notificationsEnabled) ?? '1') === '1',
    defaultReminderMinutes: Number(map.get(KEYS.defaultReminderMinutes) ?? 15),
  };
}

function serialize(value: Settings[keyof Settings]): string {
  if (typeof value === 'boolean') return value ? '1' : '0';
  return String(value);
}

export async function setSetting<K extends keyof Settings>(
  db: SQLiteDatabase,
  key: K,
  value: Settings[K],
): Promise<void> {
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    KEYS[key],
    serialize(value),
  );
}

/** Tüm görevleri, kategorileri ve ayarları siler; varsayılanları yeniden yükler */
export async function resetAll(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM tasks;
      DELETE FROM categories;
      DELETE FROM settings;
      DELETE FROM sqlite_sequence WHERE name IN ('tasks', 'categories');
    `);
    await seed(db);
  });
}
