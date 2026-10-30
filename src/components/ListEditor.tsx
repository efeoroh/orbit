import { Pressable, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ListItem, newId } from '../lib/habits';
import { colors, fonts } from '../lib/theme';
import { T } from './ui';

/** A short editable list: each item is its own habit. */
export function ListEditor({
  items,
  onChange,
  namePlaceholder,
  detailPlaceholder,
  addLabel,
  max,
}: {
  items: ListItem[];
  onChange: (items: ListItem[]) => void;
  namePlaceholder: string;
  detailPlaceholder: string;
  addLabel: string;
  max?: number;
}) {
  const update = (id: string, patch: Partial<ListItem>) => onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const canAdd = max === undefined || items.length < max;

  return (
    <View style={{ gap: 10 }}>
      {items.map((it, idx) => (
        <View key={it.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.line, paddingLeft: 14 }}>
          <View style={{ flex: 1, paddingVertical: 8 }}>
            <TextInput
              value={it.name}
              onChangeText={(name) => update(it.id, { name })}
              placeholder={namePlaceholder}
              placeholderTextColor={colors.muted}
              accessibilityLabel={`Item ${idx + 1} name`}
              autoCapitalize="words"
              style={{ fontFamily: fonts.semibold, fontSize: 16, color: colors.ink, minHeight: 28 }}
            />
            <TextInput
              value={it.detail ?? ''}
              onChangeText={(detail) => update(it.id, { detail })}
              placeholder={detailPlaceholder}
              placeholderTextColor={colors.muted}
              accessibilityLabel={`Item ${idx + 1} detail`}
              style={{ fontFamily: fonts.regular, fontSize: 14, color: colors.ink2, minHeight: 24 }}
            />
          </View>
          <Pressable
            onPress={() => onChange(items.filter((i) => i.id !== it.id))}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${it.name || 'item'}`}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24">
              <Path d="M6 6l12 12M18 6L6 18" stroke={colors.muted} strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </Pressable>
        </View>
      ))}
      {canAdd ? (
        <Pressable
          onPress={() => onChange([...items, { id: newId(), name: '', detail: '' }])}
          accessibilityRole="button"
          style={{ minHeight: 48, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
        >
          <T w="semibold" size={15}>
            + {addLabel}
          </T>
        </Pressable>
      ) : (
        <T size={13} color={colors.muted}>
          Up to {max}. Remove one to add another.
        </T>
      )}
    </View>
  );
}

/** Drop empty rows before saving. */
export function cleanList(items: ListItem[]): ListItem[] {
  return items.map((i) => ({ ...i, name: i.name.trim(), detail: i.detail?.trim() })).filter((i) => i.name);
}
