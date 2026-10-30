import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Screen, Segmented, T, Title } from '../../components/ui';
import { addDays, dateKey, fromKey, mondayIndex, shortDate } from '../../lib/dates';
import { dayLevel, isLogged, ringStats } from '../../lib/rings';
import { useOrbit } from '../../lib/store';
import { useToday } from '../../lib/useToday';
import { colors, groupColor, groupName, type Group } from '../../lib/theme';

const SHADES = ['#DCD7CE', '#B9B3A9', '#8E887F', '#5E5A55'];
const LEVEL_TEXT = ['a few habits done', 'about half done', 'most habits done', 'all rings closed'];
const RANGES = { '30d': 5, '12w': 12, year: 53 } as const;
type Range = keyof typeof RANGES;
const DOT: Record<Range, number> = { '30d': 18, '12w': 14, year: 9 };
const ROW_H: Record<Range, number> = { '30d': 34, '12w': 24, year: 15 };

export default function Progress() {
  const { settings, days } = useOrbit();
  const today = useToday();
  const [range, setRange] = useState<Range>('30d');

  const weeks = useMemo(() => {
    const t = fromKey(today);
    const thisMonday = addDays(t, -mondayIndex(t));
    const start = addDays(thisMonday, -(RANGES[range] - 1) * 7);
    return Array.from({ length: RANGES[range] }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => {
        const date = addDays(start, w * 7 + d);
        const key = dateKey(date);
        return { key, date, future: key > today };
      }),
    );
  }, [range, today]);

  const last14 = useMemo(() => Array.from({ length: 14 }, (_, i) => dateKey(addDays(fromKey(today), i - 13))), [today]);
  const size = DOT[range];

  return (
    <Screen scroll>
      <Title>Progress</Title>
      <Segmented
        label="Range"
        style={{ marginTop: 16, marginBottom: 18 }}
        value={range}
        onChange={setRange}
        options={[
          { id: '30d', label: '30 days' },
          { id: '12w', label: '12 weeks' },
          { id: 'year', label: 'Year' },
        ]}
      />

      <View style={{ flexDirection: 'row', marginBottom: 6 }}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <T key={d} size={11} color={colors.muted} style={{ flex: 1, textAlign: 'center' }}>
            {d}
          </T>
        ))}
      </View>
      {weeks.map((week) => (
        <View key={week[0].key} style={{ flexDirection: 'row', height: ROW_H[range] }}>
          {week.map(({ key, date, future }) => {
            if (future) return <View key={key} style={{ flex: 1 }} />;
            const lvl = dayLevel(days[key], settings);
            const s = lvl < 0 ? Math.max(4, Math.round(size * 0.3)) : size;
            return (
              <Pressable
                key={key}
                onPress={() => router.push(`/day/${key}`)}
                accessibilityRole="button"
                accessibilityLabel={`${shortDate(date)}, ${lvl < 0 ? 'not logged' : LEVEL_TEXT[lvl]}`}
                accessibilityHint="Opens this day to edit"
                hitSlop={4}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              >
                <View
                  style={{
                    width: s,
                    height: s,
                    borderRadius: s / 2,
                    backgroundColor: lvl < 0 ? SHADES[1] : SHADES[lvl],
                    borderWidth: key === today ? 1.5 : 0,
                    borderColor: colors.ink,
                  }}
                />
              </Pressable>
            );
          })}
        </View>
      ))}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 14, rowGap: 6, marginTop: 12 }}>
        {['0–⅓', '⅓–⅔', 'Most', 'All rings'].map((label, i) => (
          <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: SHADES[i] }} />
            <T size={11} color={colors.muted}>
              {label}
            </T>
          </View>
        ))}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: SHADES[1] }} />
          <T size={11} color={colors.muted}>
            Not logged
          </T>
        </View>
      </View>
      <T size={11} color={colors.muted} style={{ textAlign: 'center', marginTop: 4 }}>
        Tap any day to edit it
      </T>

      <View style={{ marginTop: 22 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <T w="bold" size={17} accessibilityRole="header">
            Rings
          </T>
          <T size={13} color={colors.muted}>
            last 14 days
          </T>
        </View>
        {(['body', 'mind', 'soul'] as Group[]).map((g) => (
          <View key={g} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 40, borderTopWidth: 1, borderTopColor: colors.line }}>
            <T size={14} style={{ width: 52 }}>
              {groupName[g]}
            </T>
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
              {last14.map((k) => {
                const d = days[k];
                if (!isLogged(d)) return <View key={k} style={{ width: 11, alignItems: 'center' }}><View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: SHADES[1] }} /></View>;
                const f = ringStats(d, settings)[g].frac;
                const bg = f >= 1 ? groupColor[g] : f > 0 ? `${groupColor[g]}73` : colors.dotOff;
                return <View key={k} style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: bg }} />;
              })}
            </View>
          </View>
        ))}
        <T size={11} color={colors.muted} style={{ marginTop: 6 }}>
          Solid = ring closed · faded = partly done
        </T>
      </View>
    </Screen>
  );
}
