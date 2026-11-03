import type { SQLiteDatabase } from 'expo-sqlite';

import type { CategorySlug } from '@/types';

export const DEFAULT_CATEGORIES: {
  slug: CategorySlug;
  name: string;
  color: string;
  icon: string;
}[] = [
  { slug: 'work', name: 'İş', color: '#1F6FD1', icon: 'briefcase' },
  { slug: 'personal', name: 'Kişisel', color: '#4C9BE8', icon: 'user' },
  { slug: 'shopping', name: 'Alışveriş', color: '#E07A1F', icon: 'shopping-cart' },
  { slug: 'health', name: 'Sağlık', color: '#2BA36B', icon: 'heart' },
];

export const DEFAULT_SETTINGS: Record<string, string> = {
  user_name: '',
  onboarding_done: '0',
  notifications_enabled: '1',
  default_reminder_minutes: '15',
};

/**
 * Varsayılan kategorileri ve ayarları ekler; tekrar çalıştırmak güvenlidir.
 * Aynı isimde slug'sız bir kategori varsa (eski veritabanı) onu varsayılan olarak benimser.
 */
export async function seed(db: SQLiteDatabase): Promise<void> {
  for (const [index, c] of DEFAULT_CATEGORIES.entries()) {
    await db.runAsync(
      `UPDATE categories SET slug = ?, is_default = 1
       WHERE slug IS NULL AND name = ? AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = ?)`,
      c.slug,
      c.name,
      c.slug,
    );
    await db.runAsync(
      `INSERT OR IGNORE INTO categories (slug, name, color, icon, is_default, sort_order, created_at)
       SELECT ?, ?, ?, ?, 1, ?, strftime('%Y-%m-%dT%H:%M:%S', 'now', 'localtime')
       WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = ?)`,
      c.slug,
      c.name,
      c.color,
      c.icon,
      index,
      c.slug,
    );
  }
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await db.runAsync('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', key, value);
  }
}
