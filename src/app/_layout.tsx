import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import { LoadingSplash } from '../components/LoadingSplash';
import { initFeedback, setSoundsEnabled } from '../lib/feedback';
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
  const [fontsLoaded, fontError] = useFonts({
    Fredoka_500Medium: require('@expo-google-fonts/fredoka/500Medium/Fredoka_500Medium.ttf'),
    Fredoka_600SemiBold: require('@expo-google-fonts/fredoka/600SemiBold/Fredoka_600SemiBold.ttf'),
    Nunito_400Regular: require('@expo-google-fonts/nunito/400Regular/Nunito_400Regular.ttf'),
    Nunito_600SemiBold: require('@expo-google-fonts/nunito/600SemiBold/Nunito_600SemiBold.ttf'),
    Nunito_700Bold: require('@expo-google-fonts/nunito/700Bold/Nunito_700Bold.ttf'),
  });
  const [splashDone, setSplashDone] = useState(false);
  const { loaded } = useOrbit();
  const ready = (fontsLoaded || !!fontError) && loaded;

  useEffect(() => {
    loadStore();
    setupCategories();
    initFeedback();
  }, []);

  const soundsOn = useOrbit().settings.sounds !== false;
  useEffect(() => setSoundsEnabled(soundsOn), [soundsOn]);

  useEffect(() => {
    if (!ready) return;

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

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {ready ? (
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
            <Stack.Screen name="day/[date]" options={{ presentation: 'modal' }} />
          </Stack>
        ) : null}
        {!splashDone ? (
          <LoadingSplash ready={ready} onShown={() => SplashScreen.hideAsync().catch(() => {})} onDone={() => setSplashDone(true)} />
        ) : null}
      </View>
    </SafeAreaProvider>
  );
}
