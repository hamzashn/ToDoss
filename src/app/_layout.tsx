import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { DATABASE_NAME, migrateDbIfNeeded } from '@/db/migrations';
import { configureNotifications, rescheduleAllReminders } from '@/notifications';
import { colors, fontAssets } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  if (!fontsLoaded && fontError == null) return null;

  // SQLiteProvider, migration bitene kadar çocuklarını render etmez
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
      <RootNavigator />
    </SQLiteProvider>
  );
}

function RootNavigator() {
  const db = useSQLiteContext();

  // Font ve veritabanı hazır olduğunda burası mount edilir
  useEffect(() => {
    SplashScreen.hideAsync();
    // OS'taki planlı bildirimleri DB ile eşitle (yeniden kurulum, saat değişimi vb.)
    configureNotifications()
      .then(() => rescheduleAllReminders(db))
      .catch((e) => console.warn('Bildirim kurulumu başarısız', e));
  }, [db]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="task/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="task/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="categories" />
      </Stack>
    </>
  );
}
