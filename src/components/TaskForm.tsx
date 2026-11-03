import Feather from '@expo/vector-icons/Feather';
import { router, usePreventRemove } from 'expo-router';
import { useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCategories } from '@/hooks/useCategories';
import { useResponsive } from '@/hooks/useResponsive';
import { useSettings } from '@/hooks/useSettings';
import { ensurePermission } from '@/notifications';
import { CONTENT_MAX_WIDTH, colors, radius, spacing } from '@/theme';
import type { Priority, TaskInput } from '@/types';
import { combineDateTime, formatDayMonth, parseISODate, toISODate } from '@/utils/date';
import {
  PRIORITY_OPTIONS,
  REMINDER_OPTIONS,
  addMinutesToTime,
  dateToTime,
  formatReminder,
  nextHalfHour,
  timeToDate,
} from '@/utils/task';

import { CategoryModal } from './CategoryModal';
import { DateTimePickerSheet, openNativePicker, type PickerRequest } from './DateTimePickerSheet';
import { ActionSheet } from './ui/ActionSheet';
import { AppText } from './ui/AppText';
import { Button } from './ui/Button';
import { Chip } from './ui/Chip';
import { useDialog } from './ui/Dialog';
import { IconButton } from './ui/IconButton';
import { Segmented } from './ui/Segmented';
import { TextField } from './ui/TextField';

type Props = {
  mode: 'create' | 'edit';
  initial: TaskInput;
  onSubmit: (input: TaskInput) => Promise<void>;
  onDelete?: () => Promise<void>;
};

type IconName = ComponentProps<typeof Feather>['name'];

/** Yeni görev için başlangıç değerleri */
export function defaultTaskInput(opts: {
  date?: string;
  categoryId: number;
  reminderEnabled: boolean;
  reminderMinutes: number;
}): TaskInput {
  const now = new Date();
  const date = opts.date ?? toISODate(now);
  // Bugün için hatırlatması henüz geçmemiş ilk yarım saat (17:51 + 15 dk → 18:30),
  // ileri tarihler için 09:00. Gün içine sığmayan uzun süreler hesaba katılmaz.
  const lead = opts.reminderEnabled && opts.reminderMinutes <= 120 ? opts.reminderMinutes : 0;
  const target = new Date(now.getTime() + lead * 60_000);
  const startTime =
    date !== toISODate(now)
      ? '09:00'
      : toISODate(target) === date
        ? nextHalfHour(target)
        : '23:30'; // gece yarısını aşarsa günün son yarım saati
  return {
    title: '',
    note: null,
    date,
    startTime,
    endTime: null,
    categoryId: opts.categoryId,
    priority: 1,
    reminderEnabled: opts.reminderEnabled,
    reminderMinutes: opts.reminderMinutes,
  };
}

export function TaskForm({ mode, initial, onSubmit, onDelete }: Props) {
  const insets = useSafeAreaInsets();
  const { gutter } = useResponsive();
  const { categories } = useCategories();
  const { settings } = useSettings();

  const [form, setForm] = useState<TaskInput>(initial);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // İstek, alt sayfanın kapanış animasyonu boyunca korunur
  const [picker, setPicker] = useState<PickerRequest | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [categoryModal, setCategoryModal] = useState(false);
  const [reminderSheet, setReminderSheet] = useState(false);
  const { show: showDialog, dialog } = useDialog();

  const update = <K extends keyof TaskInput>(key: K, value: TaskInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial]);

  const disablePrevention = usePreventRemove(dirty && !saving, ({ repeat }) => {
    showDialog({
      title: 'Değişiklikler kaydedilmesin mi?',
      message: 'Yaptığın değişiklikler kaybolacak.',
      tone: 'warning',
      icon: 'edit-3',
      actions: [
        { label: 'Düzenlemeye devam et', style: 'cancel' },
        { label: 'Çık', style: 'destructive', onPress: repeat },
      ],
    });
  });

  // Form kısa ömürlü olduğundan "şimdi" açılış anına sabitlenir
  const [openedAt] = useState(Date.now);

  const date = parseISODate(form.date);
  const reminderPast =
    form.reminderEnabled &&
    form.startTime != null &&
    combineDateTime(form.date, form.startTime).getTime() - form.reminderMinutes * 60_000 < openedAt;

  const showPicker = (request: PickerRequest) => {
    if (openNativePicker(request)) return;
    setPicker(request);
    setPickerOpen(true);
  };

  const pickDate = () =>
    showPicker({
      mode: 'date',
      title: 'Tarih seç',
      value: date,
      onPick: (d) => update('date', toISODate(d)),
    });

  const pickStartTime = () =>
    showPicker({
      mode: 'time',
      title: 'Saat seç',
      value: timeToDate(form.startTime ?? nextHalfHour()),
      onPick: (d) => {
        const startTime = dateToTime(d);
        setForm((f) => ({
          ...f,
          startTime,
          // Bitiş başlangıçtan önceye düşerse temizlenir
          endTime: f.endTime && f.endTime < startTime ? null : f.endTime,
        }));
      },
    });

  const pickEndTime = () => {
    if (!form.startTime) return;
    const start = form.startTime;
    showPicker({
      mode: 'time',
      title: 'Bitiş saati',
      value: timeToDate(form.endTime ?? addMinutesToTime(start, 60)),
      onPick: (d) => {
        const endTime = dateToTime(d);
        if (endTime < start) {
          showDialog({
            title: 'Geçersiz saat',
            message: 'Bitiş saati başlangıç saatinden önce olamaz.',
            tone: 'warning',
            icon: 'clock',
          });
          return;
        }
        update('endTime', endTime);
      },
    });
  };

  const clearTime = () =>
    setForm((f) => ({ ...f, startTime: null, endTime: null, reminderEnabled: false }));

  const submit = async () => {
    if (!form.title.trim()) {
      setTitleError('Görev adı gerekli');
      return;
    }
    setSaving(true);
    // Hatırlatıcı için izin kaydederken istenir
    if (form.reminderEnabled && form.startTime && settings?.notificationsEnabled && !reminderPast) {
      const granted = await ensurePermission().catch(() => false);
      if (!granted) {
        // Diyalog ekranın içinde: önce kullanıcı görsün, sonra hatırlatıcısız kaydedip çık
        showDialog({
          title: 'Bildirim izni verilmedi',
          message: 'Görev hatırlatıcısız kaydedilecek. İzni telefonunun ayarlarından açabilirsin.',
          tone: 'warning',
          icon: 'bell-off',
          actions: [{ label: 'Tamam', onPress: () => persist({ ...form, reminderEnabled: false }) }],
        });
        return;
      }
    }
    await persist(form);
  };

  const persist = async (input: TaskInput) => {
    try {
      await onSubmit(input);
      disablePrevention();
      router.back();
    } catch (e) {
      console.error(e);
      setSaving(false);
      showDialog({
        title: 'Görev kaydedilemedi',
        message: e instanceof Error ? e.message : 'Tekrar deneyin.',
        tone: 'warning',
      });
    }
  };

  const confirmDelete = () => {
    if (!onDelete) return;
    showDialog({
      title: 'Görev silinsin mi?',
      message: `"${initial.title}" kalıcı olarak silinecek.`,
      actions: [
        { label: 'Vazgeç', style: 'cancel' },
        {
          label: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete();
              disablePrevention();
              router.back();
            } catch {
              showDialog({ title: 'Görev silinemedi', message: 'Tekrar deneyin.', tone: 'warning' });
            }
          },
        },
      ],
    });
  };

  const notificationsOff = settings != null && !settings.notificationsEnabled;
  const reminderSubtitle = !form.startTime
    ? 'Hatırlatıcı için saat seçin'
    : reminderPast
      ? 'Hatırlatma zamanı geçmiş'
      : notificationsOff && form.reminderEnabled
        ? 'Bildirimler Profil’den kapalı'
        : formatReminder(form.reminderMinutes);

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }]}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.header, { paddingHorizontal: gutter }]}>
          <IconButton icon="x" accessibilityLabel="Kapat" onPress={() => router.back()} />
          <AppText variant="h2" style={styles.headerTitle} numberOfLines={1}>
            {mode === 'create' ? 'Yeni Görev' : 'Görevi Düzenle'}
          </AppText>
          {onDelete ? (
            <IconButton icon="trash-2" accessibilityLabel="Görevi sil" onPress={confirmDelete} />
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingHorizontal: gutter }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TextField
            label="Görev adı"
            value={form.title}
            onChangeText={(t) => {
              update('title', t);
              if (titleError) setTitleError(null);
            }}
            placeholder="Örn. Haftalık rapor sunumu"
            autoFocus={mode === 'create'}
            maxLength={80}
            returnKeyType="next"
            error={titleError}
          />

          <TextField
            label="Not"
            value={form.note ?? ''}
            onChangeText={(t) => update('note', t)}
            placeholder="Detay ekle (isteğe bağlı)"
            multiline
            maxLength={500}
          />

          <View style={styles.field}>
            <View style={styles.row}>
              <PickerCard icon="calendar" label="Tarih" value={formatDayMonth(date)} onPress={pickDate} />
              <PickerCard
                icon="clock"
                label="Saat"
                value={form.startTime ?? 'Saat yok'}
                muted={!form.startTime}
                onPress={pickStartTime}
                onClear={form.startTime ? clearTime : undefined}
              />
            </View>
            {form.startTime ? (
              <View style={styles.endRow}>
                <Pressable onPress={pickEndTime} hitSlop={8} accessibilityRole="button">
                  <AppText variant="label" color={colors.primary}>
                    {form.endTime ? `Bitiş ${form.endTime}` : '+ Bitiş saati ekle'}
                  </AppText>
                </Pressable>
                {form.endTime ? (
                  <Pressable
                    onPress={() => update('endTime', null)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Bitiş saatini kaldır"
                  >
                    <Feather name="x" size={16} color={colors.textMuted} />
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>

          <Section label="Kategori">
            <View style={styles.chips}>
              {categories.map((c) => (
                <Chip
                  key={c.id}
                  label={c.name}
                  selected={c.id === form.categoryId}
                  onPress={() => update('categoryId', c.id)}
                />
              ))}
              <Chip dashed accessibilityLabel="Yeni kategori ekle" onPress={() => setCategoryModal(true)} />
            </View>
          </Section>

          <Section label="Öncelik">
            <Segmented<Priority>
              options={PRIORITY_OPTIONS}
              value={form.priority}
              onChange={(p) => update('priority', p)}
            />
          </Section>

          <View style={[styles.reminder, !form.startTime && styles.disabled]}>
            <View style={styles.iconBox}>
              <Feather name="bell" size={18} color={colors.primary} />
            </View>
            <Pressable
              style={styles.reminderText}
              disabled={!form.startTime}
              onPress={() => setReminderSheet(true)}
              accessibilityRole="button"
              accessibilityHint="Hatırlatma süresini değiştir"
            >
              <AppText variant="title">Hatırlatıcı</AppText>
              <View style={styles.reminderSub}>
                <AppText
                  variant="caption"
                  color={reminderPast || (notificationsOff && form.reminderEnabled) ? colors.accentText : colors.textSecondary}
                >
                  {reminderSubtitle}
                </AppText>
                {form.startTime && form.reminderEnabled ? (
                  <Feather name="chevron-down" size={14} color={colors.textSecondary} />
                ) : null}
              </View>
            </Pressable>
            <Switch
              value={form.reminderEnabled && !!form.startTime}
              onValueChange={(v) => update('reminderEnabled', v)}
              disabled={!form.startTime}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={colors.white}
              ios_backgroundColor={colors.border}
              accessibilityLabel="Hatırlatıcı"
            />
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingHorizontal: gutter, paddingBottom: Math.max(insets.bottom, spacing.lg) },
          ]}
        >
          <Button
            title={mode === 'create' ? 'Görevi oluştur' : 'Değişiklikleri kaydet'}
            onPress={submit}
            loading={saving}
          />
        </View>
      </KeyboardAvoidingView>

      <DateTimePickerSheet visible={pickerOpen} request={picker} onClose={() => setPickerOpen(false)} />
      {dialog}
      <CategoryModal
        visible={categoryModal}
        onClose={() => setCategoryModal(false)}
        onSaved={(id) => update('categoryId', id)}
      />
      <ActionSheet
        visible={reminderSheet}
        onClose={() => setReminderSheet(false)}
        title="Ne zaman hatırlatılsın?"
        items={REMINDER_OPTIONS.map((m) => ({
          label: formatReminder(m).replace(' bildir', ''),
          icon: 'bell',
          selected: m === form.reminderMinutes,
          onPress: () => setForm((f) => ({ ...f, reminderMinutes: m, reminderEnabled: true })),
        }))}
      />
    </View>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <AppText variant="label" color={colors.textSecondary}>
        {label}
      </AppText>
      {children}
    </View>
  );
}

function PickerCard({
  icon,
  label,
  value,
  muted,
  onPress,
  onClear,
}: {
  icon: IconName;
  label: string;
  value: string;
  muted?: boolean;
  onPress: () => void;
  onClear?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      style={({ pressed }) => [styles.pickerCard, pressed && styles.pressed]}
    >
      <View style={styles.iconBox}>
        <Feather name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.pickerText}>
        <AppText variant="micro" color={colors.textSecondary}>
          {label}
        </AppText>
        <AppText variant="title" color={muted ? colors.textMuted : colors.text} numberOfLines={1}>
          {value}
        </AppText>
      </View>
      {onClear ? (
        <Pressable
          onPress={onClear}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`${label} bilgisini kaldır`}
        >
          <Feather name="x" size={16} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center' },
  headerSpacer: { width: 48 },
  scroll: {
    gap: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  field: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  endRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingLeft: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pickerCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    minHeight: 64,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.primarySoft },
  pickerText: { flex: 1, gap: 2 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  reminder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  disabled: { opacity: 0.6 },
  reminderText: { flex: 1, gap: 2 },
  reminderSub: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  footer: {
    paddingTop: spacing.md,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
});
