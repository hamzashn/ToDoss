import type { SQLiteDatabase } from 'expo-sqlite';

import type { Category, CategoryInput, CategorySlug } from '@/types';
import { toLocalDateTime } from '@/utils/date';

type CategoryRow = {
  id: number;
  slug: CategorySlug | null;
  name: string;
  color: string;
  icon: string;
  is_default: number;
  sort_order: number;
};

export type CategoryWithCount = Category & { taskCount: number };

/** Varsayılan kategoriler silinemez; silinen kategorinin görevleri buraya taşınır */
const FALLBACK_SLUG: CategorySlug = 'personal';

export class CategoryError extends Error {}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    color: row.color,
    icon: row.icon,
    isDefault: row.is_default === 1,
    sortOrder: row.sort_order,
  };
}

export async function getCategories(db: SQLiteDatabase): Promise<CategoryWithCount[]> {
  const rows = await db.getAllAsync<CategoryRow & { task_count: number }>(
    `SELECT c.*, COUNT(t.id) AS task_count
     FROM categories c
     LEFT JOIN tasks t ON t.category_id = c.id
     GROUP BY c.id
     ORDER BY c.sort_order, c.id`,
  );
  return rows.map((row) => ({ ...mapCategory(row), taskCount: row.task_count }));
}

async function assertNameAvailable(db: SQLiteDatabase, name: string, exceptId?: number) {
  // COLLATE NOCASE yalnızca ASCII'yi kapsar; Türkçe harfler için JS tarafında da karşılaştırılır
  const rows = await db.getAllAsync<{ id: number; name: string }>('SELECT id, name FROM categories');
  const target = name.toLocaleLowerCase('tr-TR');
  if (rows.some((r) => r.id !== exceptId && r.name.toLocaleLowerCase('tr-TR') === target)) {
    throw new CategoryError('Bu isimde bir kategori zaten var.');
  }
}

function normalize(input: CategoryInput) {
  const name = input.name.trim();
  if (!name) throw new CategoryError('Kategori adı gerekli.');
  if (name.length > 24) throw new CategoryError('Kategori adı en fazla 24 karakter olabilir.');
  return { name, color: input.color, icon: input.icon ?? 'tag' };
}

export async function createCategory(db: SQLiteDatabase, input: CategoryInput): Promise<number> {
  const { name, color, icon } = normalize(input);
  await assertNameAvailable(db, name);
  const result = await db.runAsync(
    `INSERT INTO categories (name, color, icon, is_default, sort_order, created_at)
     VALUES (?, ?, ?, 0, (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM categories), ?)`,
    name,
    color,
    icon,
    toLocalDateTime(new Date()),
  );
  return result.lastInsertRowId;
}

export async function updateCategory(
  db: SQLiteDatabase,
  id: number,
  input: CategoryInput,
): Promise<void> {
  const { name, color, icon } = normalize(input);
  await assertNameAvailable(db, name, id);
  await db.runAsync(
    'UPDATE categories SET name = ?, color = ?, icon = ? WHERE id = ?',
    name,
    color,
    icon,
    id,
  );
}

/**
 * Kategoriyi siler; görevleri "Kişisel"e taşır.
 * @returns Taşınan görevlerin id'leri (hatırlatıcıları yeniden planlamak için)
 */
export async function deleteCategory(db: SQLiteDatabase, id: number): Promise<number[]> {
  const category = await db.getFirstAsync<CategoryRow>('SELECT * FROM categories WHERE id = ?', id);
  if (!category) return [];
  if (category.is_default === 1) throw new CategoryError('Varsayılan kategoriler silinemez.');

  const fallback = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM categories WHERE slug = ?',
    FALLBACK_SLUG,
  );
  if (!fallback) throw new CategoryError('Varsayılan kategori bulunamadı.');

  const moved = await db.getAllAsync<{ id: number }>(
    'SELECT id FROM tasks WHERE category_id = ?',
    id,
  );
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE tasks SET category_id = ? WHERE category_id = ?', fallback.id, id);
    await db.runAsync('DELETE FROM categories WHERE id = ?', id);
  });
  return moved.map((r) => r.id);
}
