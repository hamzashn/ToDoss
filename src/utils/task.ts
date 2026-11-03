import { priorityColors } from '@/theme';
import type { Priority } from '@/types';

import { formatTime } from './date';

export const PRIORITY_OPTIONS: { value: Priority; label: string; dot: string }[] = [
  { value: 0, label: 'Düşük', dot: priorityColors[0] },
  { value: 1, label: 'Orta', dot: priorityColors[1] },
  { value: 2, label: 'Yüksek', dot: priorityColors[2] },
];

export const REMINDER_OPTIONS = [5, 10, 15, 30, 60, 1440];

/** "15 dakika önce bildir" / "1 saat önce bildir" / "1 gün önce bildir" */
export function formatReminder(minutes: number): string {
  if (minutes % 1440 === 0) return `${minutes / 1440} gün önce bildir`;
  if (minutes % 60 === 0) return `${minutes / 60} saat önce bildir`;
  return `${minutes} dakika önce bildir`;
}

/** Bugünkü ilerleme kartındaki motivasyon mesajı */
export function motivationMessage(done: number, total: number): string {
  if (total === 0) return 'Bugün için görev yok, bir tane ekle!';
  const pct = (done / total) * 100;
  if (pct === 0) return 'Hadi ilk görevle başlayalım!';
  if (pct < 50) return 'İyi gidiyorsun, devam!';
  if (pct < 100) return 'Yarıdan fazlası tamam, devam!';
  return 'Harika! Bugünün tüm görevleri tamam 🎉';
}

/** Yeni görev için varsayılan saat: bir sonraki tam ya da yarım saat ("16:40" → "17:00") */
export function nextHalfHour(now: Date = new Date()): string {
  const minutes = now.getHours() * 60 + now.getMinutes();
  const next = Math.min(Math.ceil((minutes + 1) / 30) * 30, 23 * 60 + 30);
  return formatTime(Math.floor(next / 60), next % 60);
}

/** 'HH:mm' + dakika → 'HH:mm' (gün içinde kalır) */
export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = Math.min(h * 60 + m + minutes, 23 * 60 + 59);
  return formatTime(Math.floor(total / 60), total % 60);
}

export function timeToDate(time: string, base: Date = new Date()): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

export function dateToTime(d: Date): string {
  return formatTime(d.getHours(), d.getMinutes());
}
