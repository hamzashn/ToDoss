import type { SQLiteDatabase } from 'expo-sqlite';

import { addDays, parseISODate, toISODate } from '@/utils/date';

/**
 * Yalnızca geliştirme: tasarımdakine benzer örnek görevler yükler
 * (bugünün listesi + seri ve grafikler için geçmiş günler).
 */
export async function loadSampleData(db: SQLiteDatabase, today: string): Promise<void> {
  const cats = await db.getAllAsync<{ id: number; slug: string | null }>('SELECT id, slug FROM categories');
  const id = (slug: string) => cats.find((c) => c.slug === slug)?.id ?? cats[0].id;
  const [WORK, PERSONAL, SHOP] = [id('work'), id('personal'), id('shopping')];
  const now = `${today}T08:00:00`;

  const insert = (
    date: string,
    title: string,
    categoryId: number,
    opts: { start?: string; end?: string; note?: string; priority?: number; done?: boolean } = {},
  ) =>
    db.runAsync(
      `INSERT INTO tasks (title, note, date, start_time, end_time, category_id, priority,
         completed, completed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      title,
      opts.note ?? null,
      date,
      opts.start ?? null,
      opts.end ?? null,
      categoryId,
      opts.priority ?? 1,
      opts.done ? 1 : 0,
      opts.done ? `${date}T${opts.start ?? '12:00'}:00` : null,
      now,
      now,
    );

  await db.withTransactionAsync(async () => {
    // Bugün
    await insert(today, 'Sabah koşusu', PERSONAL, { start: '07:30', end: '08:15', note: 'Sahil yolu', done: true });
    await insert(today, 'Haftalık rapor sunumu', WORK, { start: '10:00', end: '11:00', priority: 2 });
    await insert(today, 'Tasarım ekibiyle toplantı', WORK, {
      start: '13:30',
      end: '14:30',
      note: 'Toplantı odası 2',
      done: true,
    });
    await insert(today, 'Market alışverişi', SHOP, { start: '18:00', end: '18:45', note: '6 ürün' });
    await insert(today, 'Kitap okuma — 30 dk', PERSONAL, { start: '21:30', done: true });

    // Geçmiş 14 gün: her gün birkaç tamamlanmış görev (seri ve grafikler için)
    const pattern = [4, 6, 3, 7, 5, 2, 3];
    const categories = [WORK, PERSONAL, SHOP];
    for (let back = 1; back <= 14; back++) {
      const date = toISODate(addDays(parseISODate(today), -back));
      const count = pattern[back % pattern.length];
      for (let i = 0; i < count + 1; i++) {
        await insert(date, `Örnek görev ${i + 1}`, categories[i % 3], {
          start: `${String(9 + i).padStart(2, '0')}:00`,
          done: i < count,
        });
      }
    }
  });
}
