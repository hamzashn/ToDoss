import type { SQLiteDatabase } from 'expo-sqlite';

import type { CategorySlug, Priority, Task, TaskInput, TaskWithCategory } from '@/types';
import { toLocalDateTime } from '@/utils/date';

type TaskRow = {
  id: number;
  title: string;
  note: string | null;
  date: string;
  start_time: string | null;
  end_time: string | null;
  category_id: number;
  priority: number;
  reminder_enabled: number;
  reminder_minutes: number;
  notification_id: string | null;
  completed: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type TaskWithCategoryRow = TaskRow & {
  category_name: string;
  category_color: string;
  category_slug: CategorySlug | null;
};

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    note: row.note,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    categoryId: row.category_id,
    priority: row.priority as Priority,
    reminderEnabled: row.reminder_enabled === 1,
    reminderMinutes: row.reminder_minutes,
    notificationId: row.notification_id,
    completed: row.completed === 1,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTaskWithCategory(row: TaskWithCategoryRow): TaskWithCategory {
  return {
    ...mapTask(row),
    categoryName: row.category_name,
    categoryColor: row.category_color,
    categorySlug: row.category_slug,
  };
}

const SELECT_WITH_CATEGORY = `
  SELECT t.*, c.name AS category_name, c.color AS category_color, c.slug AS category_slug
  FROM tasks t
  JOIN categories c ON c.id = t.category_id`;

/** Saatli görevler saate göre, saatsizler en sonda. Tamamlananlar yerinde kalır. */
const ORDER_BY_TIME = 'ORDER BY t.start_time IS NULL, t.start_time, t.created_at, t.id';

export async function getTasksByDate(
  db: SQLiteDatabase,
  date: string,
  categoryId?: number | null,
): Promise<TaskWithCategory[]> {
  const rows =
    categoryId != null
      ? await db.getAllAsync<TaskWithCategoryRow>(
          `${SELECT_WITH_CATEGORY} WHERE t.date = ? AND t.category_id = ? ${ORDER_BY_TIME}`,
          date,
          categoryId,
        )
      : await db.getAllAsync<TaskWithCategoryRow>(
          `${SELECT_WITH_CATEGORY} WHERE t.date = ? ${ORDER_BY_TIME}`,
          date,
        );
  return rows.map(mapTaskWithCategory);
}

/** Takvim noktaları için: tarih → görev sayısı */
export async function getTaskCountsInRange(
  db: SQLiteDatabase,
  from: string,
  to: string,
): Promise<Record<string, number>> {
  const rows = await db.getAllAsync<{ date: string; count: number }>(
    'SELECT date, COUNT(*) AS count FROM tasks WHERE date BETWEEN ? AND ? GROUP BY date',
    from,
    to,
  );
  return Object.fromEntries(rows.map((r) => [r.date, r.count]));
}

export async function getTaskById(db: SQLiteDatabase, id: number): Promise<TaskWithCategory | null> {
  const row = await db.getFirstAsync<TaskWithCategoryRow>(`${SELECT_WITH_CATEGORY} WHERE t.id = ?`, id);
  return row ? mapTaskWithCategory(row) : null;
}

function normalize(input: TaskInput): TaskInput {
  const title = input.title.trim();
  if (!title) throw new Error('Görev adı gerekli.');
  const note = input.note?.trim() || null;
  const endTime = input.startTime ? input.endTime : null;
  if (input.startTime && endTime && endTime < input.startTime) {
    throw new Error('Bitiş saati başlangıçtan önce olamaz.');
  }
  return {
    ...input,
    title: title.slice(0, 80),
    note: note ? note.slice(0, 500) : null,
    endTime,
    // Saatsiz görevde hatırlatıcı olamaz
    reminderEnabled: input.startTime ? input.reminderEnabled : false,
  };
}

export async function createTask(db: SQLiteDatabase, input: TaskInput): Promise<number> {
  const t = normalize(input);
  const now = toLocalDateTime(new Date());
  const result = await db.runAsync(
    `INSERT INTO tasks
       (title, note, date, start_time, end_time, category_id, priority,
        reminder_enabled, reminder_minutes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    t.title,
    t.note,
    t.date,
    t.startTime,
    t.endTime,
    t.categoryId,
    t.priority,
    t.reminderEnabled ? 1 : 0,
    t.reminderMinutes,
    now,
    now,
  );
  return result.lastInsertRowId;
}

export async function updateTask(db: SQLiteDatabase, id: number, input: TaskInput): Promise<void> {
  const t = normalize(input);
  await db.runAsync(
    `UPDATE tasks SET
       title = ?, note = ?, date = ?, start_time = ?, end_time = ?, category_id = ?,
       priority = ?, reminder_enabled = ?, reminder_minutes = ?, updated_at = ?
     WHERE id = ?`,
    t.title,
    t.note,
    t.date,
    t.startTime,
    t.endTime,
    t.categoryId,
    t.priority,
    t.reminderEnabled ? 1 : 0,
    t.reminderMinutes,
    toLocalDateTime(new Date()),
    id,
  );
}

/** Görevin tarihini değiştirir ("Yarına ertele") */
export async function moveTaskToDate(db: SQLiteDatabase, id: number, date: string): Promise<void> {
  await db.runAsync(
    'UPDATE tasks SET date = ?, updated_at = ? WHERE id = ?',
    date,
    toLocalDateTime(new Date()),
    id,
  );
}

export async function setTaskCompleted(
  db: SQLiteDatabase,
  id: number,
  completed: boolean,
): Promise<void> {
  const now = toLocalDateTime(new Date());
  await db.runAsync(
    'UPDATE tasks SET completed = ?, completed_at = ?, updated_at = ? WHERE id = ?',
    completed ? 1 : 0,
    completed ? now : null,
    now,
    id,
  );
}

export async function setTaskNotificationId(
  db: SQLiteDatabase,
  id: number,
  notificationId: string | null,
): Promise<void> {
  await db.runAsync('UPDATE tasks SET notification_id = ? WHERE id = ?', notificationId, id);
}

/** Kategoride planlı hatırlatıcısı olan görevler (kategori adı değişince içerik güncellenir) */
export async function getScheduledTaskIdsByCategory(db: SQLiteDatabase, categoryId: number): Promise<number[]> {
  const rows = await db.getAllAsync<{ id: number }>(
    'SELECT id FROM tasks WHERE category_id = ? AND notification_id IS NOT NULL',
    categoryId,
  );
  return rows.map((r) => r.id);
}

export async function deleteTask(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM tasks WHERE id = ?', id);
}

/** Hatırlatıcısı açık, tamamlanmamış ve başlangıcı henüz geçmemiş görevler */
export async function getUpcomingReminders(
  db: SQLiteDatabase,
  now: Date = new Date(),
): Promise<TaskWithCategory[]> {
  const rows = await db.getAllAsync<TaskWithCategoryRow>(
    `${SELECT_WITH_CATEGORY}
     WHERE t.reminder_enabled = 1 AND t.completed = 0 AND t.start_time IS NOT NULL
       AND (t.date || 'T' || t.start_time) >= ?
     ORDER BY t.date, t.start_time`,
    toLocalDateTime(now).slice(0, 16),
  );
  return rows.map(mapTaskWithCategory);
}
