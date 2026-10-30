import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../lib/theme';
import { T } from './ui';

const TABS: Record<string, string> = {
  index: 'Check-in',
  rings: 'Rings',
  progress: 'Progress',
  customize: 'Customize',
};

function Icon({ name, on }: { name: string; on: boolean }) {
  const c = on ? colors.ink : colors.muted;
  const sw = on ? 2 : 1.6;
  switch (name) {
    case 'index':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={8} stroke={c} strokeWidth={1.6} fill={on ? c : 'none'} />
        </Svg>
      );
    case 'rings':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={8.5} stroke={c} strokeWidth={1.6} fill="none" />
          <Circle cx={12} cy={12} r={4.5} stroke={c} strokeWidth={1.6} fill={on ? c : 'none'} />
        </Svg>
      );
    case 'progress':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24">
          <Path d="M6 19v-5M12 19V8M18 19V5" stroke={c} strokeWidth={on ? 2.6 : 1.8} strokeLinecap="round" />
        </Svg>
      );
    default:
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={3} stroke={c} strokeWidth={sw} fill={on ? c : 'none'} />
          <Path
            d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"
            stroke={c}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
  }
}

export function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: colors.line,
        backgroundColor: colors.bg,
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, 12),
      }}
    >
      {state.routes
        .filter((r) => r.name in TABS)
        .map((route) => {
          const on = state.routes[state.index]?.key === route.key;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={TABS[route.name]}
              onPress={() => {
                if (!on) navigateToTab(route.key);
              }}
              style={{ flex: 1, alignItems: 'center', gap: 4, minHeight: 48, justifyContent: 'center' }}
            >
              <Icon name={route.name} on={on} />
              <T size={11} w={on ? 'semibold' : 'regular'} color={on ? colors.ink : colors.muted}>
                {TABS[route.name]}
              </T>
            </Pressable>
          );
        })}
    </View>
  );
}
