import { Redirect } from 'expo-router';

import { useSettings } from '@/hooks/useSettings';

export default function Index() {
  const { settings } = useSettings();

  if (!settings) return null;
  return <Redirect href={settings.onboardingDone ? '/(tabs)' : '/onboarding'} />;
}
