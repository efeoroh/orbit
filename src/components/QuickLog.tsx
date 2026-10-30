import { useRef, useState } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';
import Svg, { ClipPath, Defs, Path, Rect } from 'react-native-svg';
import { formatTime } from '../lib/dates';
import { tick } from '../lib/feedback';
import { DayLog, PRAYERS, PRAYER_NAMES, Settings, glasses } from '../lib/habits';
import { prayerTimes } from '../lib/prayer';
import { setCheck, setWater } from '../lib/store';
import { colors, type Group } from '../lib/theme';
import { HOLD_MS } from './HoldCircle';
import { T } from './ui';

type Props = { dayKey: string; date: Date; day: DayLog | undefined; settings: Settings; onCelebrate: (g: Group) => void };

/** Hold when you've prayed: marks the next prayer that isn't done yet. */
function PrayerCard({ dayKey, date, day, settings, onCelebrate }: Props) {
  const prayers = PRAYERS.filter((p) => settings.enabled[p] !== false);
  const times = prayerTimes(settings, date);
  const next = prayers.find((p) => day?.checks[p] !== true);
  const fill = useRef(new Animated.Value(0)).current;
  const [width, setWidth] = useState(0);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (ticker.current) clearInterval(ticker.current);
    ticker.current = null;
  };

  function start() {
    if (!next) return;
    tick('light');
    stop();
    ticker.current = setInterval(() => tick('light'), 160);
    Animated.timing(fill, { toValue: 1, duration: HOLD_MS, easing: Easing.linear, useNativeDriver: false }).start(({ finished }) => {
      stop();
      if (!finished) return;
      setCheck(dayKey, next, true);
      onCelebrate('soul');
      setTimeout(() => fill.setValue(0), 350);
    });
  }
  function cancel() {
    stop();
    fill.stopAnimation();
    Animated.timing(fill, { toValue: 0, duration: 180, useNativeDriver: false }).start();
  }

  if (!prayers.length) return null;

  return (
    <Pressable
      onPressIn={start}
      onPressOut={cancel}
      disabled={!next}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessibilityRole="button"
      accessibilityLabel={next ? `${PRAYER_NAMES[next]}${times ? `, ${formatTime(times[next])}` : ''}. Press and hold when you have prayed.` : 'All prayers done today'}
      accessibilityActions={next ? [{ name: 'activate', label: 'Mark prayed' }] : []}
      onAccessibilityAction={() => {
        if (!next) return;
        setCheck(dayKey, next, true);
        onCelebrate('soul');
      }}
      style={{ flex: 1, minHeight: 78, borderRadius: 18, borderWidth: 1, borderColor: '#E2DDD4', backgroundColor: colors.card, overflow: 'hidden', paddingHorizontal: 16, justifyContent: 'center' }}
    >
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: fill.interpolate({ inputRange: [0, 1], outputRange: [0, width] }),
          backgroundColor: 'rgba(179,155,197,0.35)',
        }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
        <T w="display" size={19}>
          {next ? PRAYER_NAMES[next] : 'All prayers'}
        </T>
        <T size={13} color={colors.muted}>
          {next ? (times ? formatTime(times[next]) : '') : 'done today'}
        </T>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
        {prayers.map((p) => (
          <View key={p} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: day?.checks[p] === true ? colors.soul : colors.dotOff }} />
        ))}
        {next ? (
          <T size={11} color={colors.muted} style={{ marginLeft: 4 }}>
            Hold when prayed
          </T>
        ) : null}
      </View>
    </Pressable>
  );
}

/** Tap to add a glass. Long-press to take one back. */
function WaterGlass({ dayKey, day, settings, onCelebrate }: Props) {
  const total = glasses(settings);
  const count = Math.min(total, Math.round((day?.water ?? 0) / settings.glass));
  const level = count / total;
  const top = 3 + 35 * (1 - level);

  function add() {
    if (count >= total) return;
    const n = count + 1;
    setWater(dayKey, n * settings.glass);
    if (n >= total) onCelebrate('body');
    else tick('light');
  }
  function remove() {
    if (count <= 0) return;
    tick('medium');
    setWater(dayKey, (count - 1) * settings.glass);
  }

  return (
    <Pressable
      onPress={add}
      onLongPress={remove}
      accessibilityRole="button"
      accessibilityLabel={`Water, ${count} of ${total} glasses`}
      accessibilityHint="Tap to add a glass. Long press to remove one."
      style={{ width: 86, minHeight: 78, borderRadius: 18, borderWidth: 1, borderColor: '#E2DDD4', backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', gap: 4 }}
    >
      <Svg width={30} height={40} viewBox="0 0 30 40">
        <Defs>
          <ClipPath id="glass">
            <Path d="M4 3h22l-2.6 32.5a3 3 0 0 1-3 2.5H9.6a3 3 0 0 1-3-2.5z" />
          </ClipPath>
        </Defs>
        <Rect x={0} y={top} width={30} height={40} fill={colors.body} opacity={0.85} clipPath="url(#glass)" />
        <Path d="M4 3h22l-2.6 32.5a3 3 0 0 1-3 2.5H9.6a3 3 0 0 1-3-2.5z" fill="none" stroke={colors.muted} strokeWidth={1.6} strokeLinejoin="round" />
      </Svg>
      <T size={11} color={colors.muted}>
        {count >= total ? 'Goal hit' : `${count} of ${total}`}
      </T>
    </Pressable>
  );
}

export function QuickLog(props: Props) {
  const showWater = props.settings.enabled.water !== false;
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <PrayerCard {...props} />
      {showWater ? <WaterGlass {...props} /> : null}
    </View>
  );
}
