import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PRAYERS, PrayerId } from '../lib/habits';
import { PRAYED_ACTION, rescheduleAll, setupCategories } from '../lib/notifications';
import { getState, loadStore, onSettingsChange, setCheck, useOrbit } from '../lib/store';
import { colors } from '../lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function handleResponse(res: Notifications.NotificationResponse | null) {
  if (!res) return;
  const data = res.notification.request.content.data as Record<string, unknown> | undefined;
  if (data?.type === 'prayer' && res.actionIdentifier === PRAYED_ACTION) {
    const prayer = data.prayer as PrayerId;
    const date = String(data.date ?? '');
    if (PRAYERS.includes(prayer) && date) setCheck(date, prayer, true);
  }
  if (getState().settings.onboarded) router.navigate('/');
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular: require('@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'),
    Inter_500Medium: require('@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf'),
    Inter_600SemiBold: require('@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf'),
    Inter_700Bold: require('@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf'),
  });
  const { loaded } = useOrbit();
  const ready = fontsLoaded && loaded;

  useEffect(() => {
    loadStore();
    setupCategories();
  }, []);

  useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync().catch(() => {});

    rescheduleAll(getState().settings);
    let timer: ReturnType<typeof setTimeout> | null = null;
    const offSettings = onSettingsChange((s) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => rescheduleAll(s), 600);
    });
    // Keep the rolling prayer schedule topped up whenever the app comes back.
    const appSub = AppState.addEventListener('change', (st) => {
      if (st === 'active') rescheduleAll(getState().settings);
    });
    const respSub = Notifications.addNotificationResponseReceivedListener(handleResponse);
    Notifications.getLastNotificationResponseAsync().then((r) => {
      handleResponse(r);
      Notifications.clearLastNotificationResponseAsync?.().catch(() => {});
    });
    return () => {
      offSettings();
      appSub.remove();
      respSub.remove();
      if (timer) clearTimeout(timer);
    };
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="day/[date]" options={{ presentation: 'modal' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
