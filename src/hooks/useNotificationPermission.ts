import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';

type PermissionState = {
  granted: boolean;
  canAskAgain: boolean;
  /** Android 12+: tam zamanında teslim için gerekli; yoksa bildirim gecikebilir */
  exactAlarm: boolean;
};

// Web'de yerel bildirim yok; durum sabittir
const WEB_STATE: PermissionState = { granted: false, canAskAgain: false, exactAlarm: false };

async function readPermission(): Promise<PermissionState> {
  if (Platform.OS === 'web') return WEB_STATE;
  const [perm, exact] = await Promise.all([
    Notifications.getPermissionsAsync(),
    Platform.OS === 'android' ? Notifications.getExactAlarmPermissionsAsync() : null,
  ]);
  return { granted: perm.granted, canAskAgain: perm.canAskAgain, exactAlarm: exact?.granted ?? true };
}

/** Bildirim izin durumu; kullanıcı ayarlardan dönünce yenilenir */
export function useNotificationPermission() {
  const [state, setState] = useState<PermissionState | null>(null);

  const refresh = useCallback(() => readPermission().then(setState), []);

  useEffect(() => {
    let active = true;
    const load = () =>
      readPermission().then((s) => {
        if (active) setState(s);
      });
    load();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') load();
    });
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  return { permission: state, refresh };
}
