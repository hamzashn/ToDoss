import type { SQLiteDatabase } from 'expo-sqlite';

/** En az bir görevin tamamlandığı benzersiz günler (azalan) */
export async function getCompletionDays(db: SQLiteDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ d: string }>(
    `SELECT DISTINCT date(completed_at) AS d
     FROM tasks WHERE completed = 1 AND completed_at IS NOT NULL
     ORDER BY d DESC`,
  );
  return rows.map((r) => r.d);
}

/** Tarihi (date) dönem içinde olan görevlerin toplamı ve tamamlananları — oran için */
export async function getPeriodTotals(
  db: SQLiteDatabase,
  from: string,
  to: string,
): Promise<{ total: number; done: number }> {
  const row = await db.getFirstAsync<{ total: number; done: number | null }>(
    'SELECT COUNT(*) AS total, SUM(completed) AS done FROM tasks WHERE date BETWEEN ? AND ?',
    from,
    to,
  );
  return { total: row?.total ?? 0, done: row?.done ?? 0 };
}

/** Tamamlanma anı (completed_at) dönem içinde olan görevler, gün bazında */
export async function getCompletedPerDay(
  db: SQLiteDatabase,
  from: string,
  to: string,
): Promise<Record<string, number>> {
  const rows = await db.getAllAsync<{ d: string; c: number }>(
    `SELECT date(completed_at) AS d, COUNT(*) AS c
     FROM tasks
     WHERE completed = 1 AND date(completed_at) BETWEEN ? AND ?
     GROUP BY d`,
    from,
    to,
  );
  return Object.fromEntries(rows.map((r) => [r.d, r.c]));
}

export type CategoryProgressRow = {
  id: number;
  name: string;
  color: string;
  total: number;
  done: number;
};

/** Dönemde görevi olan kategoriler: tamamlanan / toplam */
export async function getCategoryProgress(
  db: SQLiteDatabase,
  from: string,
  to: string,
): Promise<CategoryProgressRow[]> {
  return db.getAllAsync<CategoryProgressRow>(
    `SELECT c.id, c.name, c.color,
            COUNT(t.id) AS total, COALESCE(SUM(t.completed), 0) AS done
     FROM categories c
     JOIN tasks t ON t.category_id = c.id AND t.date BETWEEN ? AND ?
     GROUP BY c.id
     ORDER BY c.sort_order, c.id`,
    from,
    to,
  );
}

/** Profil özeti için tüm zamanlar */
export async function getOverview(db: SQLiteDatabase): Promise<{ total: number; done: number }> {
  const row = await db.getFirstAsync<{ total: number; done: number | null }>(
    'SELECT COUNT(*) AS total, SUM(completed) AS done FROM tasks',
  );
  return { total: row?.total ?? 0, done: row?.done ?? 0 };
}
