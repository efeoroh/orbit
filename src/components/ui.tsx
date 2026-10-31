import { ReactNode } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tap } from '../lib/feedback';
import { colors, fonts } from '../lib/theme';

type Weight = keyof typeof fonts;

export function T({
  w = 'regular',
  size = 15,
  color = colors.ink,
  style,
  ...rest
}: TextProps & { w?: Weight; size?: number; color?: string }) {
  return <Text {...rest} style={[{ fontFamily: fonts[w], fontSize: size, color }, style]} />;
}

export function Title({ children }: { children: ReactNode }) {
  return (
    <T w="display" size={32} accessibilityRole="header">
      {children}
    </T>
  );
}

const TILE = 128;
const GRAIN = require('../../assets/grain.png');

/** Paper grain laid evenly over the whole screen. */
export function Grain() {
  const { width, height } = useWindowDimensions();
  const cols = Math.ceil(width / TILE);
  const rows = Math.ceil(height / TILE) + 1;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden', zIndex: 10 }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: rows }, (_, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {Array.from({ length: cols }, (_, c) => (
            <Image key={c} source={GRAIN} style={{ width: TILE, height: TILE }} />
          ))}
        </View>
      ))}
    </View>
  );
}

export function Screen({
  children,
  scroll = false,
  edges = ['top'],
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  edges?: ('top' | 'bottom')[];
  contentStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={edges} style={{ flex: 1 }}>
        {scroll ? (
          <ScrollView contentContainerStyle={[styles.pad, { paddingBottom: 40 }, contentStyle]} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.pad, { flex: 1 }, contentStyle]}>{children}</View>
        )}
      </SafeAreaView>
      <Grain />
    </View>
  );
}

export function Segmented<K extends string>({
  options,
  value,
  onChange,
  style,
  label,
}: {
  options: { id: K; label: string }[];
  value: K;
  onChange: (k: K) => void;
  style?: StyleProp<ViewStyle>;
  label?: string;
}) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[styles.seg, style]}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable
            key={o.id}
            onPress={() => {
              tap();
              onChange(o.id);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            style={[styles.segItem, on && styles.segOn]}
          >
            <T w={on ? 'semibold' : 'regular'} size={14} color={on ? colors.ink : colors.ink2}>
              {o.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Button({
  label,
  onPress,
  kind = 'dark',
  style,
  disabled,
}: {
  label: string;
  onPress: () => void;
  kind?: 'dark' | 'outline' | 'text';
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.btn,
        kind === 'dark' && { backgroundColor: colors.dark },
        kind === 'outline' && { borderWidth: 1, borderColor: colors.border },
        kind === 'text' && { minHeight: 44 },
        { opacity: disabled ? 0.4 : pressed ? 0.75 : 1 },
        style,
      ]}
    >
      <T
        w={kind === 'text' ? 'medium' : 'semibold'}
        size={15}
        color={kind === 'dark' ? colors.onDark : colors.ink}
        style={kind === 'text' ? { textDecorationLine: 'underline' } : undefined}
      >
        {label}
      </T>
    </Pressable>
  );
}

export function Dot({ color, size = 12, ring }: { color: string; size?: number; ring?: string }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        borderWidth: ring ? 1 : 0,
        borderColor: ring,
      }}
    />
  );
}

export function Field(props: TextInputProps & { label?: string }) {
  const { label, style, ...rest } = props;
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <T size={13} color={colors.muted}>
          {label}
        </T>
      ) : null}
      <TextInput
        placeholderTextColor={colors.muted}
        accessibilityLabel={label}
        {...rest}
        style={[styles.input, style]}
      />
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function Divider() {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.line }} />;
}

export const styles = StyleSheet.create({
  pad: { paddingHorizontal: 20, paddingTop: 16 },
  seg: { flexDirection: 'row', padding: 3, backgroundColor: colors.segment, borderRadius: 10 },
  segItem: { flex: 1, minHeight: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  segOn: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  btn: { minHeight: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.ink,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
