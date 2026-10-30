import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { TabBar } from '../../components/TabBar';
import { useOrbit } from '../../lib/store';
import { colors } from '../../lib/theme';

export default function TabsLayout() {
  const { settings } = useOrbit();
  if (!settings.onboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Check-in' }} />
      <Tabs.Screen name="rings" options={{ title: 'Rings' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
      <Tabs.Screen name="customize" options={{ title: 'Customize' }} />
    </Tabs>
  );
}
