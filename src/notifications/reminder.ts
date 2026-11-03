import type { TaskWithCategory } from '@/types';
import { combineDateTime } from '@/utils/date';

/** Hatırlatma anı; planlanmaması gerekiyorsa (kapalı, tamamlanmış, saatsiz, geçmiş) null */
export function reminderTriggerDate(
  task: Pick<TaskWithCategory, 'reminderEnabled' | 'completed' | 'date' | 'startTime' | 'reminderMinutes'>,
  now: Date,
): Date | null {
  if (!task.reminderEnabled || task.completed || !task.startTime) return null;
  const at = new Date(combineDateTime(task.date, task.startTime).getTime() - task.reminderMinutes * 60_000);
  return at.getTime() > now.getTime() ? at : null;
}

/** "15 dakika sonra" / "1 saat sonra" / "1 gün sonra" */
function formatLead(minutes: number): string {
  if (minutes % 1440 === 0) return `${minutes / 1440} gün sonra`;
  if (minutes % 60 === 0) return `${minutes / 60} saat sonra`;
  return `${minutes} dakika sonra`;
}

/** "10:00 · İş — 15 dakika sonra başlıyor" */
export function reminderBody(task: Pick<TaskWithCategory, 'startTime' | 'categoryName' | 'reminderMinutes'>): string {
  return `${task.startTime} · ${task.categoryName} — ${formatLead(task.reminderMinutes)} başlıyor`;
}
