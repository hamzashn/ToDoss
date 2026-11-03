import { addDays, DAYS_SHORT, endOfMonth, parseISODate, startOfMonth, startOfWeek, toISODate, weekdayIndex } from './date';

export type StatsPeriod = 'week' | 'month';

export type PeriodRange = { from: string; to: string; prevFrom: string; prevTo: string };

/** Hafta: Pazartesi–Pazar, karşılaştırma önceki hafta. Ay: takvim ayı, karşılaştırma önceki ay. */
export function periodRange(period: StatsPeriod, today: string): PeriodRange {
  const t = parseISODate(today);
  if (period === 'week') {
    const start = startOfWeek(t);
    return {
      from: toISODate(start),
      to: toISODate(addDays(start, 6)),
      prevFrom: toISODate(addDays(start, -7)),
      prevTo: toISODate(addDays(start, -1)),
    };
  }
  const start = startOfMonth(t);
  const prevStart = new Date(t.getFullYear(), t.getMonth() - 1, 1);
  return {
    from: toISODate(start),
    to: toISODate(endOfMonth(t)),
    prevFrom: toISODate(prevStart),
    prevTo: toISODate(endOfMonth(prevStart)),
  };
}

/**
 * Bugünden geriye ardışık "en az bir görev tamamlanan gün" sayısı.
 * Bugün henüz tamamlama yoksa seri dünden sayılır (bugün bozulmuş sayılmaz).
 */
export function currentStreak(completionDays: Iterable<string>, today: string): number {
  const days = new Set(completionDays);
  let cursor = parseISODate(today);
  if (!days.has(today)) cursor = addDays(cursor, -1);
  let streak = 0;
  while (days.has(toISODate(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function longestStreak(completionDays: Iterable<string>): number {
  const sorted = [...new Set(completionDays)].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of sorted) {
    run = prev && toISODate(addDays(parseISODate(prev), 1)) === day ? run + 1 : 1;
    best = Math.max(best, run);
    prev = day;
  }
  return best;
}

export type Bar = { label: string; value: number; highlighted: boolean };

/**
 * Hafta: 7 gün (Pzt…Paz). Ay: Pazartesi başlangıçlı haftalar ("1. Hf"…).
 * Vurgulanan çubuk bugün ya da içinde bulunulan hafta.
 */
export function buildBars(
  period: StatsPeriod,
  range: Pick<PeriodRange, 'from' | 'to'>,
  perDay: Record<string, number>,
  today: string,
): Bar[] {
  const start = parseISODate(range.from);

  if (period === 'week') {
    return DAYS_SHORT.map((label, i) => {
      const iso = toISODate(addDays(start, i));
      return { label, value: perDay[iso] ?? 0, highlighted: iso === today };
    });
  }

  const offset = weekdayIndex(start);
  const daysInMonth = parseISODate(range.to).getDate();
  const weekCount = Math.ceil((offset + daysInMonth) / 7);
  const bars: Bar[] = Array.from({ length: weekCount }, (_, i) => ({
    label: `${i + 1}. Hf`,
    value: 0,
    highlighted: false,
  }));
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = toISODate(new Date(start.getFullYear(), start.getMonth(), day));
    const bar = bars[Math.floor((offset + day - 1) / 7)];
    bar.value += perDay[iso] ?? 0;
    if (iso === today) bar.highlighted = true;
  }
  return bars;
}

/** null: dönemde görev yok */
export function completionRate(done: number, total: number): number | null {
  return total > 0 ? Math.round((done / total) * 100) : null;
}

/** "+6 geçen haftaya göre" / "−3 geçen aya göre" / "Geçen haftayla aynı" */
export function formatCountDelta(delta: number, period: StatsPeriod): string {
  if (delta === 0) return period === 'week' ? 'Geçen haftayla aynı' : 'Geçen ayla aynı';
  const sign = delta > 0 ? '+' : '−';
  return `${sign}${Math.abs(delta)} ${period === 'week' ? 'geçen haftaya' : 'geçen aya'} göre`;
}

/** "+5 puan" / "−2 puan" / "Değişim yok"; karşılaştırılacak veri yoksa null */
export function formatRateDelta(rate: number | null, prevRate: number | null): string | null {
  if (rate == null || prevRate == null) return null;
  const delta = rate - prevRate;
  if (delta === 0) return 'Değişim yok';
  return `${delta > 0 ? '+' : '−'}${Math.abs(delta)} puan`;
}
