// Intl desteği Android'de tutarsız olabildiği için Türkçe adlar sabit dizilerde tutulur.
export const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];
/** Pazartesi ile başlar */
export const DAYS_LONG = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
export const DAYS_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

const pad = (n: number) => String(n).padStart(2, '0');

/** Pazartesi = 0 … Pazar = 6 */
export function weekdayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

/** Yerel tarih → 'YYYY-MM-DD'. toISOString kullanılmaz (UTC kayması olur). */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Yerel tarih-saat → 'YYYY-MM-DDTHH:mm:ss' */
export function toLocalDateTime(d: Date): string {
  return `${toISODate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** 'YYYY-MM-DD' → yerel gece yarısı */
export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** 'YYYY-MM-DD' + 'HH:mm' → yerel Date */
export function combineDateTime(date: string, time: string): Date {
  const d = parseISODate(date);
  const [h, m] = time.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

export function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Haftanın Pazartesi'si (gece yarısı) */
export function startOfWeek(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  r.setDate(r.getDate() - weekdayIndex(r));
  return r;
}

export function weekDays(d: Date): Date[] {
  const start = startOfWeek(d);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/** "07:30" */
export function formatTime(h: number, m: number): string {
  return `${pad(h)}:${pad(m)}`;
}

/** "3 Kasım" — yıl farklıysa "3 Kasım 2027" */
export function formatDayMonth(d: Date, reference: Date = new Date()): string {
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return d.getFullYear() === reference.getFullYear() ? base : `${base} ${d.getFullYear()}`;
}

/** "Salı, 3 Kasım" */
export function formatWeekdayDayMonth(d: Date): string {
  return `${DAYS_LONG[weekdayIndex(d)]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "Kasım 2026" */
export function formatMonthYear(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "Bugün, Salı" / "Yarın, Çarşamba" / "Dün, Pazartesi" / "5 Kasım, Perşembe" */
export function relativeDayLabel(d: Date, now: Date = new Date()): string {
  const day = DAYS_LONG[weekdayIndex(d)];
  if (isSameDay(d, now)) return `Bugün, ${day}`;
  if (isSameDay(d, addDays(now, 1))) return `Yarın, ${day}`;
  if (isSameDay(d, addDays(now, -1))) return `Dün, ${day}`;
  return `${formatDayMonth(d, now)}, ${day}`;
}

/** Saate göre selam */
export function greeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h >= 5 && h < 12) return 'Günaydın!';
  if (h >= 12 && h < 18) return 'İyi günler!';
  if (h >= 18 && h < 22) return 'İyi akşamlar!';
  return 'İyi geceler!';
}

/** "%83" — Türkçede yüzde işareti başta */
export function formatPercent(n: number): string {
  return `%${Math.round(n)}`;
}
