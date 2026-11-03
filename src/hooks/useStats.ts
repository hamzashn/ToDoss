import type { SQLiteDatabase } from 'expo-sqlite';
import { useCallback } from 'react';

import * as repo from '@/db/stats';
import {
  buildBars,
  completionRate,
  currentStreak,
  longestStreak,
  periodRange,
  type StatsPeriod,
} from '@/utils/stats';

import { useDbQuery } from './useDbQuery';

export async function loadStats(db: SQLiteDatabase, period: StatsPeriod, today: string) {
  const range = periodRange(period, today);
  const [days, totals, prevTotals, perDay, prevPerDay, categories] = await Promise.all([
    repo.getCompletionDays(db),
    repo.getPeriodTotals(db, range.from, range.to),
    repo.getPeriodTotals(db, range.prevFrom, range.prevTo),
    repo.getCompletedPerDay(db, range.from, range.to),
    repo.getCompletedPerDay(db, range.prevFrom, range.prevTo),
    repo.getCategoryProgress(db, range.from, range.to),
  ]);

  const sum = (r: Record<string, number>) => Object.values(r).reduce((a, b) => a + b, 0);
  const completed = sum(perDay);
  const rate = completionRate(totals.done, totals.total);
  const prevRate = completionRate(prevTotals.done, prevTotals.total);

  return {
    streak: currentStreak(days, today),
    completedToday: days.includes(today),
    completed,
    completedDelta: completed - sum(prevPerDay),
    rate,
    prevRate,
    total: totals.total,
    bars: buildBars(period, range, perDay, today),
    categories,
  };
}

export type StatsData = Awaited<ReturnType<typeof loadStats>>;

export function useStats(period: StatsPeriod, today: string) {
  const query = useCallback((db: SQLiteDatabase) => loadStats(db, period, today), [period, today]);
  const result = useDbQuery(['tasks', 'categories'], query);
  return { ...result, stats: result.data };
}

/** Profil özeti: toplam, tamamlanan, en uzun seri */
export function useOverview() {
  const query = useCallback(async (db: SQLiteDatabase) => {
    const [overview, days] = await Promise.all([repo.getOverview(db), repo.getCompletionDays(db)]);
    return { ...overview, longestStreak: longestStreak(days) };
  }, []);
  const result = useDbQuery(['tasks'], query);
  return { ...result, overview: result.data };
}
