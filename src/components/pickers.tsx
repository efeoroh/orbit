import { useState } from 'react';
import { LayoutAnimation, Pressable, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { tap } from '../lib/feedback';
import { colors, fonts } from '../lib/theme';
import { T } from './ui';

const OTHER = '__other__';

function Chevron({ open }: { open: boolean }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
      <Path d="M6 9l6 6 6-6" stroke={colors.ink2} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function Check({ on, round }: { on: boolean; round?: boolean }) {
  return (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: round ? 11 : 7,
        borderWidth: 1.5,
        borderColor: on ? colors.ink : colors.border,
        backgroundColor: on ? colors.ink : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {on ? (
        <Svg width={13} height={13} viewBox="0 0 24 24">
          <Path d="M5 12.5l4.5 4.5L19 7.5" stroke={colors.onDark} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      ) : null}
    </View>
  );
}

const card = {
  backgroundColor: colors.surface,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: colors.line,
} as const;

/** Single choice from a list, with "Other" to type your own. Opens and closes like a dropdown. */
export function Dropdown({
  label,
  value,
  options,
  onChange,
  placeholder = 'Choose one',
  otherPlaceholder = 'Type your own',
  noneLabel,
}: {
  label?: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
  placeholder?: string;
  otherPlaceholder?: string;
  /** Adds a "none" option (value becomes ''). */
  noneLabel?: string;
}) {
  const isCustom = !!value && !options.includes(value);
  const [open, setOpen] = useState(!value);
  const [otherOn, setOtherOn] = useState(isCustom);
  const [other, setOther] = useState(isCustom ? value : '');

  const toggle = () => {
    tap();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((o) => !o);
  };
  const pick = (v: string) => {
    tap();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (v === OTHER) {
      setOtherOn(true);
      if (other.trim()) onChange(other.trim());
      return;
    }
    setOtherOn(false);
    onChange(v);
    setOpen(false);
  };

  const shown = value ? value : noneLabel && value === '' && !open ? noneLabel : '';

  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <T w="semibold" size={13} color={colors.muted}>
          {label}
        </T>
      ) : null}
      <Pressable onPress={toggle} accessibilityRole="button" accessibilityLabel={`${label ?? 'Choice'}: ${shown || placeholder}`} accessibilityState={{ expanded: open }} style={[card, { minHeight: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
        <T w={shown ? 'semibold' : 'regular'} size={16} color={shown ? colors.ink : colors.muted} style={{ flex: 1 }} numberOfLines={2}>
          {shown || placeholder}
        </T>
        <Chevron open={open} />
      </Pressable>
      {open ? (
        <View style={[card, { overflow: 'hidden' }]}>
          {options.map((o, i) => {
            const on = value === o && !otherOn;
            return (
              <Pressable key={o} onPress={() => pick(o)} accessibilityRole="radio" accessibilityState={{ selected: on }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingHorizontal: 16, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}>
                <Check on={on} round />
                <T size={15} style={{ flex: 1 }}>
                  {o}
                </T>
              </Pressable>
            );
          })}
          <Pressable onPress={() => pick(OTHER)} accessibilityRole="radio" accessibilityState={{ selected: otherOn }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: colors.line }}>
            <Check on={otherOn} round />
            <T size={15}>Other</T>
          </Pressable>
          {otherOn ? (
            <View style={{ flexDirection: 'row', gap: 8, padding: 10, paddingTop: 0 }}>
              <TextInput
                autoFocus
                value={other}
                onChangeText={(t) => {
                  setOther(t);
                  onChange(t.trim());
                }}
                onSubmitEditing={() => other.trim() && setOpen(false)}
                placeholder={otherPlaceholder}
                placeholderTextColor={colors.muted}
                returnKeyType="done"
                accessibilityLabel={otherPlaceholder}
                style={{ flex: 1, minHeight: 44, borderRadius: 10, backgroundColor: colors.bg, paddingHorizontal: 12, fontFamily: fonts.regular, fontSize: 15, color: colors.ink }}
              />
            </View>
          ) : null}
          {noneLabel ? (
            <Pressable onPress={() => pick('')} accessibilityRole="radio" accessibilityState={{ selected: value === '' }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: colors.line }}>
              <Check on={value === '' && !otherOn} round />
              <T size={15} color={colors.ink2}>
                {noneLabel}
              </T>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/** Pick several from a list, plus add your own with "Other". */
export function MultiPick({
  options,
  selected,
  onToggle,
  onAdd,
  onRemove,
  max,
  otherPlaceholder = 'Type your own',
}: {
  options: readonly string[];
  /** Names currently selected. */
  selected: string[];
  onToggle: (name: string, on: boolean) => void;
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
  max?: number;
  otherPlaceholder?: string;
}) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const lower = selected.map((s) => s.toLowerCase());
  const custom = selected.filter((n) => !options.some((o) => o.toLowerCase() === n.toLowerCase()));
  const full = max !== undefined && selected.length >= max;

  const add = () => {
    const n = text.trim();
    if (!n) return;
    if (!lower.includes(n.toLowerCase())) onAdd(n);
    tap();
    setText('');
    setAdding(false);
  };

  return (
    <View style={{ gap: 10 }}>
      <View style={[card, { overflow: 'hidden' }]}>
        {[...options, ...custom].map((o, i) => {
          const on = lower.includes(o.toLowerCase());
          const isCustom = !options.includes(o as never);
          const disabled = !on && full;
          return (
            <Pressable
              key={o}
              disabled={disabled}
              onPress={() => {
                tap();
                if (isCustom) onRemove(o);
                else onToggle(o, !on);
              }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on, disabled }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingHorizontal: 16, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line, opacity: disabled ? 0.4 : 1 }}
            >
              <Check on={on} />
              <T size={15} style={{ flex: 1 }}>
                {o}
              </T>
              {isCustom ? (
                <T size={12} color={colors.muted}>
                  Tap to remove
                </T>
              ) : null}
            </Pressable>
          );
        })}
        {!full ? (
          adding ? (
            <View style={{ flexDirection: 'row', gap: 8, padding: 10, borderTopWidth: 1, borderTopColor: colors.line }}>
              <TextInput
                autoFocus
                value={text}
                onChangeText={setText}
                onSubmitEditing={add}
                placeholder={otherPlaceholder}
                placeholderTextColor={colors.muted}
                returnKeyType="done"
                autoCapitalize="words"
                accessibilityLabel={otherPlaceholder}
                style={{ flex: 1, minHeight: 44, borderRadius: 10, backgroundColor: colors.bg, paddingHorizontal: 12, fontFamily: fonts.regular, fontSize: 15, color: colors.ink }}
              />
              <Pressable onPress={add} accessibilityRole="button" style={{ minWidth: 64, minHeight: 44, borderRadius: 10, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 }}>
                <T w="semibold" size={14} color={colors.onDark}>
                  Add
                </T>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => {
                tap();
                setAdding(true);
              }}
              accessibilityRole="button"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: colors.line }}
            >
              <T w="semibold" size={18} style={{ width: 22, textAlign: 'center' }}>
                +
              </T>
              <T w="semibold" size={15}>
                Other / add more
              </T>
            </Pressable>
          )
        ) : null}
      </View>
      {full ? (
        <T size={13} color={colors.muted}>
          Up to {max}. Untick one to choose another.
        </T>
      ) : null}
    </View>
  );
}

/** A row of choice chips, with "Other" for a typed value and an optional "don't track". */
export function Chips<V extends string | number>({
  options,
  value,
  onChange,
  format = (v) => String(v),
  other,
  off,
}: {
  options: readonly V[];
  value: V | null;
  onChange: (v: V | null) => void;
  format?: (v: V) => string;
  other?: { placeholder: string; parse: (t: string) => V | null; keyboard?: 'decimal-pad' | 'default' };
  off?: string;
}) {
  const isCustom = value !== null && !options.includes(value);
  const [otherOn, setOtherOn] = useState(isCustom);
  const [text, setText] = useState(isCustom && value !== null ? String(value) : '');
  const chip = (on: boolean) => ({
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: on ? colors.ink : colors.line,
    backgroundColor: on ? colors.ink : colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  });

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {options.map((o) => {
          const on = value === o && !otherOn;
          return (
            <Pressable
              key={String(o)}
              onPress={() => {
                tap();
                setOtherOn(false);
                onChange(o);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              style={chip(on)}
            >
              <T w="semibold" size={15} color={on ? colors.onDark : colors.ink}>
                {format(o)}
              </T>
            </Pressable>
          );
        })}
        {other ? (
          <Pressable
            onPress={() => {
              tap();
              setOtherOn(true);
              const v = other.parse(text);
              if (v !== null) onChange(v);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: otherOn }}
            style={chip(otherOn)}
          >
            <T w="semibold" size={15} color={otherOn ? colors.onDark : colors.ink}>
              Other
            </T>
          </Pressable>
        ) : null}
        {off ? (
          <Pressable
            onPress={() => {
              tap();
              setOtherOn(false);
              onChange(null);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: value === null }}
            style={chip(value === null)}
          >
            <T w="semibold" size={15} color={value === null ? colors.onDark : colors.ink2}>
              {off}
            </T>
          </Pressable>
        ) : null}
      </View>
      {other && otherOn ? (
        <TextInput
          autoFocus
          value={text}
          keyboardType={other.keyboard ?? 'default'}
          onChangeText={(t) => {
            setText(t);
            const v = other.parse(t);
            if (v !== null) onChange(v);
          }}
          placeholder={other.placeholder}
          placeholderTextColor={colors.muted}
          accessibilityLabel={other.placeholder}
          style={[card, { minHeight: 48, paddingHorizontal: 14, fontFamily: fonts.regular, fontSize: 16, color: colors.ink }]}
        />
      ) : null}
    </View>
  );
}

/** − value + */
export function Stepper({ value, onChange, step, min = 0, format }: { value: number; onChange: (n: number) => void; step: number; min?: number; format: (n: number) => string }) {
  const btn = { width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: colors.border, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: colors.surface };
  const set = (n: number) => {
    tap();
    onChange(Math.max(min, Math.round(n * 100) / 100));
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
      <Pressable onPress={() => set(value - step)} disabled={value - step < min} accessibilityRole="button" accessibilityLabel="Less" style={[btn, { opacity: value - step < min ? 0.35 : 1 }]}>
        <T size={24}>−</T>
      </Pressable>
      <T w="display" size={30} style={{ minWidth: 150, textAlign: 'center' }} accessibilityLiveRegion="polite">
        {format(value)}
      </T>
      <Pressable onPress={() => set(value + step)} accessibilityRole="button" accessibilityLabel="More" style={btn}>
        <T size={24}>+</T>
      </Pressable>
    </View>
  );
}
