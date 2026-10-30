import { Pressable, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { colors } from '../lib/theme';
import { T } from './ui';

/** The big soft "Tap if done" button from the mockups. */
export function TapCircle({ size = 220, onPress, label }: { size?: number; onPress: () => void; label: string }) {
  const r = size / 2;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: r,
        transform: [{ scale: pressed ? 0.97 : 1 }],
        shadowColor: '#50463A',
        shadowOpacity: 0.12,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 12 },
      })}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <RadialGradient id="tap" cx="38%" cy="30%" r="75%">
            <Stop offset="0" stopColor="#F2EEE7" />
            <Stop offset="0.55" stopColor="#E6E0D6" />
            <Stop offset="1" stopColor="#D8D1C4" />
          </RadialGradient>
        </Defs>
        <Circle cx={r} cy={r} r={r - 1} fill="url(#tap)" stroke="#C9C2B5" strokeWidth={1} />
      </Svg>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <T w="semibold" size={20} color={colors.ink}>
          Tap if done
        </T>
      </View>
    </Pressable>
  );
}
