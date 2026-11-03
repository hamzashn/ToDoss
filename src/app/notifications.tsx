import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { useUpcomingReminders } from '@/hooks/useTasks';
import { colors, radius, shadows, spacing } from '@/theme';
import { parseISODate, relativeDayLabel } from '@/utils/date';
import { formatReminder } from '@/utils/task';

export default function NotificationsScreen() {
  const { reminders, loading } = useUpcomingReminders();

  return (
    <Screen edges={['top', 'bottom']} contentStyle={styles.content}>
      <View style={styles.header}>
        <IconButton icon="chevron-left" accessibilityLabel="Geri" onPress={() => router.back()} />
        <AppText variant="h2">Hatırlatıcılar</AppText>
      </View>

      {!loading && reminders.length === 0 ? (
        <EmptyState
          icon="bell-off"
          title="Yaklaşan hatırlatıcı yok"
          description="Görev oluştururken hatırlatıcıyı açarsan burada görünür."
        />
      ) : null}

      {reminders.map((t) => (
        <Pressable
          key={t.id}
          onPress={() => router.push({ pathname: '/task/[id]', params: { id: String(t.id) } })}
          accessibilityRole="button"
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
          <View style={styles.iconBox}>
            <Feather name="bell" size={18} color={colors.primary} />
          </View>
          <View style={styles.body}>
            <AppText variant="title" numberOfLines={1}>
              {t.title}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {relativeDayLabel(parseISODate(t.date))} · {t.startTime}
            </AppText>
            <AppText variant="caption" color={colors.primary}>
              {formatReminder(t.reminderMinutes).replace('bildir', 'bildirilecek')}
            </AppText>
          </View>
          <Badge label={t.categoryName} color={t.categoryColor} />
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  pressed: { backgroundColor: colors.background },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  body: { flex: 1, gap: 2 },
});
