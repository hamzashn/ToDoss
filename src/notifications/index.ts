import * as Notifications from 'expo-notifications';
import type { SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';

import { getSettings } from '@/db/settings';
import { getTaskById, getUpcomingReminders, setTaskNotificationId } from '@/db/tasks';
import { colors } from '@/theme';
import type { TaskWithCategory } from '@/types';

import { reminderBody, reminderTriggerDate } from './reminder';

export const REMINDER_CHANNEL_ID = 'reminders';

// Web'de yerel bildirim desteği yok
const supported = Platform.OS !== 'web';

// Planlama işlemleri sırayla çalışır: paralel iptal/planlama yetim bildirim bırakabilir
let queue: Promise<unknown> = Promise.resolve();
function serial<A extends unknown[]>(fn: (...args: A) => Promise<void>) {
  return (...args: A): Promise<void> => {
    const run = queue.then(() => fn(...args));
    queue = run.catch((e) => console.warn('Bildirim işlemi başarısız', e));
    return run;
  };
}

/** Uygulama açılışında bir kez: ön planda gösterim ve Android kanalı */
export async function configureNotifications(): Promise<void> {
  if (!supported) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: 'Hatırlatıcılar',
      description: 'Görev başlamadan önce gönderilen hatırlatmalar',
      // Çalışma zamanında mevcut; eklenti derlenmiş dosyadaki yorum nedeniyle bulamıyor
      // eslint-disable-next-line import/namespace
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: colors.primary,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

export async function hasPermission(): Promise<boolean> {
  if (!supported) return false;
  const { granted } = await Notifications.getPermissionsAsync();
  return granted;
}

/** İzin yoksa ister. Kullanıcı daha önce reddettiyse sistem penceresi açılmaz, false döner. */
export async function ensurePermission(): Promise<boolean> {
  if (!supported) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function cancel(notificationId: string | null): Promise<void> {
  if (!supported || !notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Bildirim zaten tetiklenmiş ya da silinmiş olabilir
  }
}

async function schedule(task: TaskWithCategory, now: Date): Promise<string | null> {
  const date = reminderTriggerDate(task, now);
  if (!date) return null;
  return Notifications.scheduleNotificationAsync({
    content: {
      title: `⏰ ${task.title}`,
      body: reminderBody(task),
      data: { taskId: task.id },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: REMINDER_CHANNEL_ID,
    },
  });
}

/**
 * Görevin hatırlatıcısını güncel duruma getirir: eskisini iptal eder,
 * gerekiyorsa yenisini planlar ve id'yi DB'ye yazar. Her görev yazmasından sonra çağrılır.
 */
export const syncTaskReminder = serial(async (db: SQLiteDatabase, taskId: number) => {
  if (!supported) return;
  const task = await getTaskById(db, taskId);
  if (!task) return;

  await cancel(task.notificationId);

  let notificationId: string | null = null;
  const settings = await getSettings(db);
  if (settings.notificationsEnabled && (await hasPermission())) {
    try {
      notificationId = await schedule(task, new Date());
    } catch (e) {
      console.warn('Hatırlatıcı planlanamadı', e);
    }
  }
  if (notificationId !== task.notificationId) {
    await setTaskNotificationId(db, taskId, notificationId);
  }
});

export async function syncTaskReminders(db: SQLiteDatabase, taskIds: number[]): Promise<void> {
  await Promise.all(taskIds.map((id) => syncTaskReminder(db, id)));
}

/** Görev silinmeden önce hatırlatıcısını iptal eder */
export const cancelTaskReminder = serial(async (db: SQLiteDatabase, taskId: number) => {
  const task = await getTaskById(db, taskId);
  if (task) await cancel(task.notificationId);
});

async function cancelAllUnsafe(db: SQLiteDatabase): Promise<void> {
  if (!supported) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  await db.runAsync('UPDATE tasks SET notification_id = NULL WHERE notification_id IS NOT NULL');
}

/** Planlı tüm hatırlatıcıları iptal eder ve DB'deki id'leri temizler */
export const cancelAllReminders = serial(cancelAllUnsafe);

/**
 * Tüm hatırlatıcıları baştan planlar. Uygulama açılışında ve bildirimler
 * yeniden açıldığında çağrılır; OS ile DB arasındaki tutarsızlıkları giderir.
 */
export const rescheduleAllReminders = serial(async (db: SQLiteDatabase) => {
  if (!supported) return;
  await cancelAllUnsafe(db);
  const settings = await getSettings(db);
  if (!settings.notificationsEnabled || !(await hasPermission())) return;

  const now = new Date();
  for (const task of await getUpcomingReminders(db, now)) {
    try {
      const id = await schedule(task, now);
      if (id) await setTaskNotificationId(db, task.id, id);
    } catch (e) {
      console.warn('Hatırlatıcı planlanamadı', e);
    }
  }
});
