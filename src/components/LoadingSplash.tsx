import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import { colors } from '../lib/theme';

// The splash artwork is 853 × 1844; the three dots sit at these points in it.
const ART_W = 853;
const ART_H = 1844;
const DOTS = [
  { x: 460, color: colors.body },
  { x: 503, color: colors.mind },
  { x: 546, color: colors.soul },
];
const DOT_Y = 1745;
const DOT_R = 13;

/**
 * Same artwork as the native splash, so the hand-off is seamless. The three dots
 * hop once, one after another, then the whole screen fades into the app.
 */
export function LoadingSplash({ ready, onDone, onShown }: { ready: boolean; onDone: () => void; onShown: () => void }) {
  const { width, height } = useWindowDimensions();
  const hops = useRef(DOTS.map(() => new Animated.Value(0))).current;
  const fade = useRef(new Animated.Value(1)).current;
  const played = useRef(false);
  const animDone = useRef(false);

  // "cover" layout, matching the native splash
  const scale = Math.max(width / ART_W, height / ART_H);
  const ox = (width - ART_W * scale) / 2;
  const oy = (height - ART_H * scale) / 2;
  const r = DOT_R * scale;

  const finish = () => {
    Animated.timing(fade, { toValue: 0, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() => onDone());
  };

  useEffect(() => {
    if (played.current) return;
    played.current = true;
    Animated.sequence([
      Animated.delay(250),
      Animated.stagger(
        190,
        hops.map((v) => Animated.timing(v, { toValue: 1, duration: 560, easing: Easing.linear, useNativeDriver: true })),
      ),
      Animated.delay(150),
    ]).start(() => {
      animDone.current = true;
      if (ready) finish();
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (ready && animDone.current) finish();
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade, backgroundColor: colors.bg, zIndex: 100 }]} pointerEvents="none" accessibilityLabel="Orbit is loading">
      <Image
        source={require('../../assets/splash.jpg')}
        onLoadEnd={onShown}
        style={{ position: 'absolute', left: ox, top: oy, width: ART_W * scale, height: ART_H * scale }}
      />
      {DOTS.map((d, i) => {
        const v = hops[i];
        // squash → leap → land → settle
        const translateY = v.interpolate({ inputRange: [0, 0.18, 0.45, 0.72, 0.86, 1], outputRange: [0, 0, -18, 0, -2, 0] });
        const scaleX = v.interpolate({ inputRange: [0, 0.18, 0.45, 0.72, 0.86, 1], outputRange: [1, 1.18, 0.9, 1.14, 0.97, 1] });
        const scaleY = v.interpolate({ inputRange: [0, 0.18, 0.45, 0.72, 0.86, 1], outputRange: [1, 0.82, 1.1, 0.86, 1.03, 1] });
        return (
          <View key={i} style={{ position: 'absolute', left: ox + d.x * scale - r, top: oy + DOT_Y * scale - r, width: r * 2, height: r * 2 }}>
            <Animated.View
              style={{
                width: r * 2,
                height: r * 2,
                borderRadius: r,
                backgroundColor: d.color,
                transform: [{ translateY }, { scaleX }, { scaleY }],
              }}
            />
          </View>
        );
      })}
    </Animated.View>
  );
}
