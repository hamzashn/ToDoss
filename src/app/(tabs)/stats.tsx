import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BarChart } from '@/components/BarChart';
import { CategoryProgress } from '@/components/CategoryProgress';
import { StatCard } from '@/components/StatCard';
import { StreakCard } from '@/components/StreakCard';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { useStats } from '@/hooks/useStats';
import { useToday } from '@/hooks/useToday';
import { spacing } from '@/theme';
import { formatPercent } from '@/utils/date';
import { formatCountDelta, formatRateDelta, type StatsPeriod } from '@/utils/stats';

const PERIOD_OPTIONS: { value: StatsPeriod; label: string }[] = [
  { value: 'week', label: 'Hafta' },
  { value: 'month', label: 'Ay' },
];

function toneOf(delta: number | null): 'positive' | 'negative' | 'neutral' {
  if (delta == null || delta === 0) return 'neutral';
  return delta > 0 ? 'positive' : 'negative';
}

export default function StatsScreen() {
  const today = useToday();
  const [period, setPeriod] = useState<StatsPeriod>('week');
  const { stats } = useStats(period, today);

  const rateDelta = stats?.rate != null && stats.prevRate != null ? stats.rate - stats.prevRate : null;

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <AppText variant="h1">İlerleme</AppText>
        <Segmented options={PERIOD_OPTIONS} value={period} onChange={setPeriod} compact />
      </View>

      {stats ? (
        <>
          <StreakCard streak={stats.streak} completedToday={stats.completedToday} />

          <View style={styles.row}>
            <StatCard
              label="Tamamlanan"
              value={String(stats.completed)}
              note={formatCountDelta(stats.completedDelta, period)}
              tone={toneOf(stats.completedDelta)}
            />
            <StatCard
              label="Tamamlama oranı"
              value={formatPercent(stats.rate ?? 0)}
              note={stats.total === 0 ? 'Henüz görev yok' : formatRateDelta(stats.rate, stats.prevRate)}
              tone={toneOf(rateDelta)}
            />
          </View>

          <BarChart
            title={period === 'week' ? 'Bu hafta' : 'Bu ay'}
            unit={period === 'week' ? 'görev / gün' : 'görev / hafta'}
            bars={stats.bars}
          />

          <CategoryProgress rows={stats.categories} />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.xxl, paddingBottom: spacing.xl, gap: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  row: { flexDirection: 'row', gap: spacing.md },
});
