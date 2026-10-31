import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Screen, Segmented, T, Title } from '../../components/ui';
import { addDays, dateKey, fromKey, mondayIndex, shortDate } from '../../lib/dates';
import { GROUPS, isLogged, ringStats, ringsClosed } from '../../lib/rings';
import { tap } from '../../lib/feedback';
import { useOrbit } from '../../lib/store';
import { colors, groupColor, groupInk, groupLight, groupName } from '../../lib/theme';
import { useToday } from '../../lib/useToday';

const SHADES = ['#E2DDD3', '#BDB6AA', '#8E887F', '#4F4C47'];
const NOT_LOGGED = '#BDB6AA';
const LEVEL_TEXT = ['no rings closed', '1 ring closed', '2 rings closed', 'all 3 rings closed'];
const RANGES = { '30d': 5, '12w': 12, year: 53 } as const;
type Range = keyof typeof RANGES;
const DOT: Record<Range, number> = { '30d': 20, '12w': 15, year: 9 };
const ROW_H: Record<Range, number> = { '30d': 34, '12w': 24, year: 14 };

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
  // With fewer than 3 rings switched on, "all rings" is however many there are.
  const ringCount = GROUPS.filter((g) => ringStats(undefined, settings)[g].total > 0).length || 3;

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
            const closed = ringsClosed(days[key], settings);
            const lvl = closed < 0 ? -1 : closed >= ringCount ? 3 : Math.min(closed, 2);
            const s = lvl < 0 ? Math.max(4, Math.round(size * 0.28)) : size;
            return (
              <Pressable
                key={key}
                onPress={() => {
                  tap();
                  router.push(`/day/${key}`);
                }}
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
                    backgroundColor: lvl < 0 ? NOT_LOGGED : SHADES[lvl],
                    borderWidth: key === today && lvl >= 0 ? 2 : 0,
                    borderColor: colors.ink,
                  }}
                />
              </Pressable>
            );
          })}
        </View>
      ))}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 14, rowGap: 6, marginTop: 12 }}>
        {['None', '1 ring', '2 rings', ringCount === 3 ? 'All 3' : 'All'].map((label, i) => (
          <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: SHADES[i] }} />
            <T size={12} color={colors.ink2}>
              {label}
            </T>
          </View>
        ))}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: NOT_LOGGED }} />
          <T size={12} color={colors.ink2}>
            Not logged
          </T>
        </View>
      </View>
      <T size={12} color={colors.muted} style={{ textAlign: 'center', marginTop: 4 }}>
        Tap any day to edit it
      </T>

      <View style={{ marginTop: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <T w="display" size={20} accessibilityRole="header">
            Rings
          </T>
          <T size={13} color={colors.muted}>
            last 14 days
          </T>
        </View>
        {GROUPS.map((g) => (
          <View key={g} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 46, borderTopWidth: 1, borderTopColor: colors.line }}>
            <T w="semibold" size={15} color={groupInk[g]} style={{ width: 52 }}>
              {groupName[g]}
            </T>
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
              {last14.map((k) => {
                const d = days[k];
                if (!isLogged(d))
                  return (
                    <View key={k} style={{ width: 15, alignItems: 'center' }}>
                      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: NOT_LOGGED }} />
                    </View>
                  );
                const f = ringStats(d, settings)[g].frac;
                const bg = f >= 1 ? groupColor[g] : f > 0 ? groupLight[g] : colors.track;
                return <View key={k} style={{ width: 15, height: 15, borderRadius: 8, backgroundColor: bg }} />;
              })}
            </View>
          </View>
        ))}
        <T size={12} color={colors.muted} style={{ marginTop: 6 }}>
          Full color = ring closed · light = partly done
        </T>
      </View>
    </Screen>
  );
}
