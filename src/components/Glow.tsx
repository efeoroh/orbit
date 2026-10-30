import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

export type GlowHandle = { flash: (color: string) => void };

/** Screen edges light up in a ring's color, then fade. */
export const Glow = forwardRef<GlowHandle>(function Glow(_props, ref) {
  const opacity = useRef(new Animated.Value(0)).current;
  const [color, setColor] = useState('#8B9B82');

  useImperativeHandle(ref, () => ({
    flash(c: string) {
      setColor(c);
      opacity.stopAnimation();
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 130, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 750, delay: 120, useNativeDriver: true }),
      ]).start();
    },
  }));

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity, zIndex: 20 }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="edge" cx="50%" cy="50%" r="72%" gradientUnits="objectBoundingBox">
            <Stop offset="0.55" stopColor={color} stopOpacity={0} />
            <Stop offset="0.82" stopColor={color} stopOpacity={0.45} />
            <Stop offset="1" stopColor={color} stopOpacity={0.9} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#edge)" />
      </Svg>
    </Animated.View>
  );
});
