import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { TaskItem } from '@/components/TaskItem';
import { openTaskEditor, useTaskMenu } from '@/components/TaskMenu';
import { TodayProgressCard } from '@/components/TodayProgressCard';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Chip } from '@/components/ui/Chip';
import { useDialog } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { useCategories } from '@/hooks/useCategories';
import { useResponsive } from '@/hooks/useResponsive';
import { useSettings } from '@/hooks/useSettings';
import { useTaskActions, useTasks, useUpcomingReminders } from '@/hooks/useTasks';
import { useToday } from '@/hooks/useToday';
import { colors, spacing } from '@/theme';
import type { TaskWithCategory } from '@/types';
import { addDays, formatWeekdayDayMonth, greeting, parseISODate, toISODate } from '@/utils/date';

export default function HomeScreen() {
  const today = useToday();
  const { gutter } = useResponsive();
  const { settings } = useSettings();
  const { categories } = useCategories();
  const { tasks, loading, refresh } = useTasks(today);
  const { reminders } = useUpcomingReminders();
  const { setCompleted } = useTaskActions();
  const { show: showDialog, dialog } = useDialog();

  const [filter, setFilter] = useState<number | null>(null);
  // İyimser güncelleme: DB yanıtı gelene kadar işaretleme anında görünür
  const [pending, setPending] = useState<Record<number, boolean>>({});

  // Silinen kategori seçiliyse filtre "Tümü"ye döner
  const activeFilter = filter != null && categories.some((c) => c.id === filter) ? filter : null;

  const dayTasks = useMemo(
    () => tasks.map((t) => (t.id in pending ? { ...t, completed: pending[t.id] } : t)),
    [tasks, pending],
  );
  const visible = activeFilter == null ? dayTasks : dayTasks.filter((t) => t.categoryId === activeFilter);
  const doneCount = dayTasks.filter((t) => t.completed).length;
  const remaining = visible.filter((t) => !t.completed).length;

  const toggle = useCallback(
    async (task: TaskWithCategory) => {
      const next = !task.completed;
      if (next) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPending((p) => ({ ...p, [task.id]: next }));
      try {
        await setCompleted(task.id, next);
        // Güncel veri gelmeden iyimser değer kaldırılırsa işaret bir an geri döner
        await refresh();
      } catch {
        showDialog({ title: 'Görev güncellenemedi', message: 'Tekrar deneyin.', tone: 'warning' });
      } finally {
        setPending(({ [task.id]: _, ...rest }) => rest);
      }
    },
    [setCompleted, refresh, showDialog],
  );

  const { openMenu, menu } = useTaskMenu(toggle);

  const now = new Date();
  // Zil noktası: bugün veya yarın için bekleyen hatırlatıcı
  const tomorrow = toISODate(addDays(parseISODate(today), 1));
  const hasSoonReminder = reminders.some((r) => r.date === today || r.date === tomorrow);

  const header = (
    <View style={styles.headerBlock}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.navigate('/profile')}
          accessibilityRole="button"
          accessibilityLabel="Profili aç"
        >
          <Avatar name={settings?.userName ?? ''} />
        </Pressable>
        <View style={styles.greeting}>
          <AppText variant="caption" color={colors.textSecondary}>
            {formatWeekdayDayMonth(parseISODate(today))}
          </AppText>
          <AppText variant="h1" numberOfLines={1}>
            {greeting(now)}
          </AppText>
        </View>
        <IconButton
          icon="bell"
          accessibilityLabel={hasSoonReminder ? 'Bildirimler, yaklaşan hatırlatıcı var' : 'Bildirimler'}
          badge={hasSoonReminder}
          onPress={() => router.push('/notifications')}
        />
      </View>

      <TodayProgressCard done={doneCount} total={dayTasks.length} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        // Kenar boşluğu içeride: chip'ler ekran kenarına kadar kayabilsin
        style={{ marginHorizontal: -gutter }}
        contentContainerStyle={[styles.filters, { paddingHorizontal: gutter }]}
      >
        <Chip label="Tümü" dark selected={activeFilter == null} onPress={() => setFilter(null)} />
        {categories.map((c) => (
          <Chip key={c.id} label={c.name} selected={activeFilter === c.id} onPress={() => setFilter(c.id)} />
        ))}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <AppText variant="h2">Görevler</AppText>
        {visible.length > 0 ? (
          <AppText variant="caption" color={colors.textSecondary}>
            {remaining > 0 ? `${remaining} görev kaldı` : 'Hepsi tamam'}
          </AppText>
        ) : null}
      </View>
    </View>
  );

  return (
    <Screen scroll={false} padded={false}>
      <FlatList
        data={visible}
        keyExtractor={(t) => String(t.id)}
        renderItem={({ item }) => (
          <TaskItem task={item} onToggle={toggle} onPress={openTaskEditor} onLongPress={openMenu} />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          loading ? undefined : (
            <EmptyState
              icon="check-circle"
              title={activeFilter == null ? 'Bugün için görev yok' : 'Bu kategoride bugün görev yok'}
              description="Gününü planlamak için yeni bir görev ekle."
              action={{ label: 'Görev ekle', onPress: () => router.push('/task/new') }}
            />
          )
        }
        ItemSeparatorComponent={Separator}
        contentContainerStyle={[styles.list, { paddingHorizontal: gutter }]}
        showsVerticalScrollIndicator={false}
      />

      {menu}
      {dialog}
    </Screen>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  list: { paddingTop: spacing.xl, paddingBottom: spacing.xl },
  headerBlock: { gap: spacing.xl, marginBottom: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  greeting: { flex: 1 },
  filters: { gap: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  separator: { height: spacing.md },
});
