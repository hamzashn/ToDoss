import { router } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { openTaskEditor, useTaskMenu } from '@/components/TaskMenu';
import { TimelineItem } from '@/components/TimelineItem';
import { WeekStrip } from '@/components/WeekStrip';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { useResponsive } from '@/hooks/useResponsive';
import { useSelectedDate } from '@/hooks/useSelectedDate';
import { useTaskCounts, useTasks } from '@/hooks/useTasks';
import { useToday } from '@/hooks/useToday';
import { CONTENT_MAX_WIDTH, colors, radius, shadows, spacing } from '@/theme';
import {
  addDays,
  formatMonthYear,
  parseISODate,
  relativeDayLabel,
  startOfWeek,
  toISODate,
} from '@/utils/date';

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { gutter } = useResponsive();
  const today = useToday();
  const [selected, setSelected] = useSelectedDate();

  const selectedDate = parseISODate(selected);
  const weekStart = startOfWeek(selectedDate);
  const from = toISODate(weekStart);
  const to = toISODate(addDays(weekStart, 6));

  const { counts } = useTaskCounts(from, to);
  const { tasks, loading } = useTasks(selected);
  const { openMenu, menu } = useTaskMenu();

  const todayVisible = today >= from && today <= to;
  const untimed = useMemo(() => tasks.filter((t) => !t.startTime), [tasks]);
  const timed = useMemo(() => tasks.filter((t) => t.startTime), [tasks]);

  const shiftWeek = useCallback(
    (direction: -1 | 1) => setSelected(toISODate(addDays(parseISODate(selected), direction * 7))),
    [selected, setSelected],
  );

  const addForSelected = () => router.push({ pathname: '/task/new', params: { date: selected } });

  return (
    <View style={styles.root}>
      <View style={[styles.panel, { paddingTop: insets.top + spacing.xl }]}>
        <View style={[styles.panelInner, { paddingHorizontal: gutter }]}>
          <View style={styles.header}>
            <Pressable
              style={styles.title}
              onPress={() => setSelected(today)}
              accessibilityRole="button"
              accessibilityHint="Bugüne döner"
            >
              <AppText variant="caption" color={colors.textSecondary}>
                Takvim
              </AppText>
              <View style={styles.monthRow}>
                <AppText variant="h1" numberOfLines={1} adjustsFontSizeToFit>
                  {formatMonthYear(selectedDate)}
                </AppText>
                {!todayVisible ? (
                  <View style={styles.todayChip}>
                    <AppText variant="micro" color={colors.primary}>
                      Bugün
                    </AppText>
                  </View>
                ) : null}
              </View>
            </Pressable>
            <View style={styles.nav}>
              <IconButton icon="chevron-left" accessibilityLabel="Önceki hafta" onPress={() => shiftWeek(-1)} />
              <IconButton icon="chevron-right" accessibilityLabel="Sonraki hafta" onPress={() => shiftWeek(1)} />
            </View>
          </View>

          <WeekStrip
            selected={selected}
            today={today}
            counts={counts}
            onSelect={setSelected}
            onSwipe={shiftWeek}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingHorizontal: gutter }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.dayHeader}>
          <AppText variant="h2" numberOfLines={1} style={styles.dayTitle}>
            {relativeDayLabel(selectedDate, parseISODate(today))}
          </AppText>
          {tasks.length > 0 ? (
            <AppText variant="caption" color={colors.textSecondary}>
              {tasks.length} görev
            </AppText>
          ) : null}
        </View>

        {!loading && tasks.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="Bu gün için planlanmış görev yok"
            description="Seçili güne yeni bir görev ekleyebilirsin."
            action={{ label: 'Görev ekle', onPress: addForSelected }}
          />
        ) : null}

        {untimed.length > 0 ? (
          <View style={styles.group}>
            <AppText variant="label" color={colors.textSecondary}>
              Gün içinde
            </AppText>
            {untimed.map((t) => (
              <TimelineItem key={t.id} task={t} onPress={openTaskEditor} onLongPress={openMenu} />
            ))}
          </View>
        ) : null}

        {timed.length > 0 ? (
          <View style={styles.group}>
            {untimed.length > 0 ? (
              <AppText variant="label" color={colors.textSecondary}>
                Saatli
              </AppText>
            ) : null}
            {timed.map((t) => (
              <TimelineItem key={t.id} task={t} onPress={openTaskEditor} onLongPress={openMenu} />
            ))}
          </View>
        ) : null}
      </ScrollView>

      {menu}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  panel: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.xl + 4,
    borderBottomRightRadius: radius.xl + 4,
    paddingBottom: spacing.xl,
    ...shadows.card,
  },
  panelInner: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    gap: spacing.xl,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { flex: 1 },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  todayChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  nav: { flexDirection: 'row', gap: spacing.sm },
  content: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  dayTitle: { flex: 1 },
  group: { gap: spacing.md },
});
