import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { tick } from '../lib/feedback';
import { colors } from '../lib/theme';
import { T } from './ui';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
export const HOLD_MS = 800;

/** Press and hold to complete. A ring draws around the button while held; letting go early cancels. */
export function HoldCircle({
  size = 210,
  color,
  label,
  onComplete,
}: {
  size?: number;
  color: string;
  label: string;
  onComplete: () => void;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);
  const [state, setState] = useState<'idle' | 'holding' | 'done'>('idle');
  const doneRef = useRef(false);

  const outer = size + 34;
  const r = outer / 2 - 4;
  const circ = 2 * Math.PI * r;
  const offset = progress.interpolate({ inputRange: [0, 1], outputRange: [circ, 0] });

  const stopTicks = () => {
    if (ticker.current) clearInterval(ticker.current);
    ticker.current = null;
  };
  useEffect(() => stopTicks, []);

  function start() {
    if (doneRef.current) return;
    setState('holding');
    tick('light');
    let n = 0;
    stopTicks();
    ticker.current = setInterval(() => {
      n += 1;
      tick(n < 3 ? 'light' : 'medium');
    }, 150);
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 30 }).start();
    Animated.timing(progress, { toValue: 1, duration: HOLD_MS, easing: Easing.linear, useNativeDriver: false }).start(({ finished }) => {
      stopTicks();
      if (!finished) return;
      doneRef.current = true;
      setState('done');
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.05, useNativeDriver: true, speed: 40 }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }),
      ]).start();
      onComplete();
      setTimeout(() => {
        progress.setValue(0);
        doneRef.current = false;
        setState('idle');
      }, 450);
    });
  }

  function cancel() {
    if (doneRef.current) return;
    stopTicks();
    progress.stopAnimation();
    Animated.timing(progress, { toValue: 0, duration: 200, useNativeDriver: false }).start();
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
    setState('idle');
  }

  const text = state === 'done' ? 'Done' : state === 'holding' ? 'Keep holding…' : 'Hold if done';

  return (
    <View style={{ width: outer, height: outer, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={outer} height={outer} style={{ position: 'absolute' }}>
        <Circle cx={outer / 2} cy={outer / 2} r={r} stroke={colors.track} strokeWidth={6} fill="none" />
        <AnimatedCircle
          cx={outer / 2}
          cy={outer / 2}
          r={r}
          stroke={color}
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={offset}
          rotation={-90}
          origin={`${outer / 2}, ${outer / 2}`}
        />
      </Svg>
      <Pressable
        onPressIn={start}
        onPressOut={cancel}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="Press and hold to mark as done"
        accessibilityActions={[{ name: 'activate', label: 'Mark done' }]}
        onAccessibilityAction={(e) => e.nativeEvent.actionName === 'activate' && onComplete()}
      >
        <Animated.View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale }],
            shadowColor: '#50463A',
            shadowOpacity: 0.12,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 12 },
          }}
        >
          <Svg width={size} height={size} style={{ position: 'absolute' }}>
            <Defs>
              <RadialGradient id="tap" cx="38%" cy="30%" r="75%">
                <Stop offset="0" stopColor="#F4F0EA" />
                <Stop offset="0.55" stopColor="#E8E2D8" />
                <Stop offset="1" stopColor="#DAD2C5" />
              </RadialGradient>
            </Defs>
            <Circle cx={size / 2} cy={size / 2} r={size / 2 - 1} fill="url(#tap)" stroke="#CFC7B9" strokeWidth={1} />
          </Svg>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <T w="displayMedium" size={21}>
              {text}
            </T>
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}
