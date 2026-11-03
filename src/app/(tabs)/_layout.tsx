import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { TabBar } from '@/components/TabBar';

function openTaskFromNotification(response: Notifications.NotificationResponse | null) {
  if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
  const taskId = response.notification.request.content.data?.taskId;
  if (typeof taskId === 'number') {
    router.push({ pathname: '/task/[id]', params: { id: String(taskId) } });
  }
}

/**
 * Bildirime dokununca ilgili görevi açar. Sekmeler, onboarding sonrası her zaman
 * yığının altında bulunduğundan dinleyici burada yaşar (soğuk açılışta yönlendirmeyle çakışmaz).
 */
function useNotificationTaps() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    // Uygulama bildirime dokunarak açıldıysa
    openTaskFromNotification(Notifications.getLastNotificationResponse());
    Notifications.clearLastNotificationResponse();

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      openTaskFromNotification(response);
      Notifications.clearLastNotificationResponse();
    });
    return () => sub.remove();
  }, []);
}

export default function TabsLayout() {
  useNotificationTaps();

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Ana sayfa' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Takvim' }} />
      <Tabs.Screen name="stats" options={{ title: 'İlerleme' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  );
}
