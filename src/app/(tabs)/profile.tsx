import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Linking, Platform, StyleSheet, Switch, View } from 'react-native';

import { SettingsGroup, SettingsRow } from '@/components/SettingsRow';
import { ActionSheet } from '@/components/ui/ActionSheet';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { useDialog } from '@/components/ui/Dialog';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { loadSampleData } from '@/db/sample';
import { useCategories } from '@/hooks/useCategories';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { useOpenSession } from '@/hooks/useOpenSession';
import { useSettings } from '@/hooks/useSettings';
import { useOverview } from '@/hooks/useStats';
import { ensurePermission, rescheduleAllReminders } from '@/notifications';
import { colors, radius, shadows, spacing } from '@/theme';
import { toISODate } from '@/utils/date';
import { events } from '@/utils/events';
import { REMINDER_OPTIONS, formatReminder } from '@/utils/task';

export default function ProfileScreen() {
  const db = useSQLiteContext();
  const { settings, set, resetAll } = useSettings();
  const { categories } = useCategories();
  const { overview } = useOverview();
  const { permission, refresh: refreshPermission } = useNotificationPermission();

  const [nameSheet, setNameSheet] = useState(false);
  const [reminderSheet, setReminderSheet] = useState(false);
  const { show: showDialog, dialog } = useDialog();

  if (!settings) return null;

  const notificationsOn = settings.notificationsEnabled && !!permission?.granted;

  const toggleNotifications = async (value: boolean) => {
    if (!value) {
      await set('notificationsEnabled', false);
      return;
    }
    const granted = await ensurePermission();
    await refreshPermission();
    if (!granted) {
      showDialog({
        title: 'Bildirim izni gerekli',
        message: 'Hatırlatıcılar için telefonunun ayarlarından bildirim iznini aç.',
        tone: 'warning',
        icon: 'bell-off',
        actions: [
          { label: 'Vazgeç', style: 'cancel' },
          { label: 'Ayarları aç', onPress: () => Linking.openSettings() },
        ],
      });
      return;
    }
    await set('notificationsEnabled', true);
  };

  const requestExactAlarm = async () => {
    try {
      await Notifications.requestExactAlarmPermissionsAsync();
    } catch {
      Linking.openSettings();
    }
    await refreshPermission();
    // İzinle birlikte planlı bildirimler tam zamanlıya geçsin
    rescheduleAllReminders(db).catch(() => {});
  };

  const reset = async () => {
    try {
      await resetAll();
      router.replace('/onboarding');
    } catch {
      showDialog({ title: 'Veriler silinemedi', message: 'Tekrar deneyin.', tone: 'warning' });
    }
  };

  // Çift onay: ikinci diyalog ilki tamamen kapandıktan sonra açılır
  const confirmReset = () =>
    showDialog({
      title: 'Tüm veriler silinsin mi?',
      message: 'Görevlerin, kategorilerin ve ayarların kalıcı olarak silinecek.',
      icon: 'alert-triangle',
      actions: [
        { label: 'Vazgeç', style: 'cancel' },
        {
          label: 'Devam et',
          style: 'destructive',
          onPress: () =>
            showDialog({
              title: 'Emin misin?',
              message: 'Bu işlem geri alınamaz.',
              actions: [
                { label: 'Vazgeç', style: 'cancel' },
                { label: 'Hepsini sil', style: 'destructive', onPress: reset },
              ],
            }),
        },
      ],
    });

  const notificationDescription = !permission
    ? undefined
    : !permission.granted && settings.notificationsEnabled
      ? 'İzin verilmedi — ayarlardan açmak için dokun'
      : notificationsOn
        ? 'Hatırlatıcılar açık'
        : 'Hatırlatıcılar kapalı';

  return (
    <Screen contentStyle={styles.content}>
      <AppText variant="h1">Profil</AppText>

      <View style={styles.profileCard}>
        <Avatar name={settings.userName} size={72} />
        <View style={styles.profileText}>
          <AppText variant="h2" numberOfLines={1}>
            {settings.userName || 'İsimsiz kullanıcı'}
          </AppText>
          <Button variant="link" title="Adını düzenle" onPress={() => setNameSheet(true)} style={styles.editLink} />
        </View>
      </View>

      <View style={styles.summary}>
        <SummaryStat label="Toplam görev" value={overview?.total ?? 0} />
        <SummaryStat label="Tamamlanan" value={overview?.done ?? 0} />
        <SummaryStat label="En uzun seri" value={overview?.longestStreak ?? 0} suffix=" gün" />
      </View>

      <SectionLabel>Ayarlar</SectionLabel>
      <SettingsGroup>
        <SettingsRow
          icon="tag"
          title="Kategoriler"
          description={`${categories.length} kategori`}
          onPress={() => router.push('/categories')}
        />
        <Divider />
        <SettingsRow
          icon="bell"
          title="Bildirimler"
          description={notificationDescription}
          descriptionColor={!permission?.granted && settings.notificationsEnabled ? colors.accentText : undefined}
          onPress={!permission?.granted && settings.notificationsEnabled ? () => Linking.openSettings() : undefined}
          right={
            <Switch
              value={notificationsOn}
              onValueChange={toggleNotifications}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={colors.white}
              ios_backgroundColor={colors.border}
              accessibilityLabel="Bildirimler"
            />
          }
        />
        <Divider />
        <SettingsRow
          icon="clock"
          title="Varsayılan hatırlatma"
          description={formatReminder(settings.defaultReminderMinutes)}
          onPress={() => setReminderSheet(true)}
        />
        {Platform.OS === 'android' && notificationsOn && permission && !permission.exactAlarm ? (
          <>
            <Divider />
            <SettingsRow
              icon="alert-triangle"
              title="Tam zamanında hatırlat"
              description="İzin verilmezse hatırlatmalar birkaç dakika gecikebilir"
              descriptionColor={colors.accentText}
              onPress={requestExactAlarm}
            />
          </>
        ) : null}
        <Divider />
        <SettingsRow
          icon="book-open"
          title="Tanıtımı tekrar göster"
          onPress={async () => {
            await set('onboardingDone', false);
            router.replace('/onboarding');
          }}
        />
      </SettingsGroup>

      {__DEV__ ? (
        <SettingsGroup>
          <SettingsRow
            icon="database"
            title="Örnek veri yükle"
            description="Geliştirme: grafikler ve seri için örnek görevler"
            onPress={async () => {
              await loadSampleData(db, toISODate(new Date()));
              events.emit('tasks');
              rescheduleAllReminders(db).catch(() => {});
            }}
          />
        </SettingsGroup>
      ) : null}

      <SectionLabel>Tehlikeli bölge</SectionLabel>
      <SettingsGroup>
        <SettingsRow
          icon="trash-2"
          title="Tüm verileri sıfırla"
          description="Görevler, kategoriler ve ayarlar silinir"
          destructive
          onPress={confirmReset}
        />
      </SettingsGroup>

      <AppText variant="caption" color={colors.textMuted} align="center" style={styles.version}>
        ToDoss v{Constants.expoConfig?.version ?? '1.0.0'}
      </AppText>

      <NameSheet
        visible={nameSheet}
        initial={settings.userName}
        onClose={() => setNameSheet(false)}
        onSave={(name) => set('userName', name)}
      />
      <ActionSheet
        visible={reminderSheet}
        onClose={() => setReminderSheet(false)}
        title="Varsayılan hatırlatma"
        items={REMINDER_OPTIONS.map((m) => ({
          label: formatReminder(m).replace(' bildir', ''),
          icon: 'clock',
          selected: m === settings.defaultReminderMinutes,
          onPress: () => set('defaultReminderMinutes', m),
        }))}
      />
      {dialog}
    </Screen>
  );
}

function NameSheet({
  visible,
  initial,
  onClose,
  onSave,
}: {
  visible: boolean;
  initial: string;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
}) {
  // Her açılışta form o anki adla yeniden kurulur; kapanırken içerik korunur
  const { session } = useOpenSession(visible, null);
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Sana nasıl hitap edelim?">
      <NameForm key={session} initial={initial} onClose={onClose} onSave={onSave} />
    </BottomSheet>
  );
}

function NameForm({
  initial,
  onClose,
  onSave,
}: {
  initial: string;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(initial);
  const save = async () => {
    await onSave(name.trim().slice(0, 30));
    onClose();
  };

  return (
    <View style={styles.sheetForm}>
      <TextField
        label="Adın"
        value={name}
        onChangeText={setName}
        placeholder="Örn. Ayşe"
        maxLength={30}
        autoFocus
        autoCapitalize="words"
        returnKeyType="done"
        onSubmitEditing={save}
      />
      <Button title="Kaydet" onPress={save} />
    </View>
  );
}

function SummaryStat({ label, value, suffix = '' }: { label: string; value: number; suffix?: string }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}${suffix}`}>
      <AppText variant="h2" weight="extrabold" numberOfLines={1} adjustsFontSizeToFit>
        {value}
        {suffix ? <AppText variant="caption" color={colors.textSecondary}>{suffix}</AppText> : null}
      </AppText>
      <AppText variant="caption" color={colors.textSecondary} numberOfLines={2}>
        {label}
      </AppText>
    </View>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <AppText variant="label" color={colors.textSecondary} style={styles.sectionLabel}>
      {children}
    </AppText>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.xxl, paddingBottom: spacing.xl, gap: spacing.lg },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  profileText: { flex: 1, alignItems: 'flex-start' },
  editLink: { paddingHorizontal: 0, minHeight: 32 },
  summary: { flexDirection: 'row', gap: spacing.md },
  stat: {
    flex: 1,
    gap: 2,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  sectionLabel: { marginTop: spacing.sm },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 68 },
  version: { marginTop: spacing.md },
  sheetForm: { gap: spacing.xl },
});
