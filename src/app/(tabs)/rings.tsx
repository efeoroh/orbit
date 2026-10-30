import { View } from 'react-native';
import { Rings } from '../../components/Rings';
import { Screen, T, Title } from '../../components/ui';
import { formatTime, fromKey, longDate } from '../../lib/dates';
import { HabitDef, PrayerId, fmtNum, glasses, habitsIn } from '../../lib/habits';
import { prayerTimes } from '../../lib/prayer';
import { GROUPS, ringStats } from '../../lib/rings';
import { useOrbit } from '../../lib/store';
import { colors, groupColor, groupInk, groupLight, groupName, type Group } from '../../lib/theme';
import { useToday } from '../../lib/useToday';

export default function RingsScreen() {
  const { settings, days } = useOrbit();
  const key = useToday();
  const date = fromKey(key);
  const day = days[key];
  const stats = ringStats(day, settings);
  const times = prayerTimes(settings, date);
  const now = Date.now();
  const evening = new Date();
  evening.setHours(17, 0, 0, 0);
  const shown = GROUPS.filter((g) => stats[g].total > 0);

  function status(h: HabitDef): { text: string; dot: string; ink: string } {
    const g = h.group;
    if (h.kind === 'water') {
      const total = glasses(settings);
      const n = Math.min(total, Math.round((day?.water ?? 0) / settings.glass));
      return {
        text: n >= total ? 'Done' : `${n} of ${total} glasses`,
        dot: n >= total ? groupColor[g] : n > 0 ? groupLight[g] : colors.dotOff,
        ink: colors.ink,
      };
    }
    const v = day?.checks[h.id];
    if (v === true) return { text: 'Done', dot: groupColor[g], ink: colors.ink };
    if (v === false) return { text: 'Missed', dot: colors.dotOff, ink: colors.ink2 };
    if (h.kind === 'prayer' && times) {
      const at = times[h.id as PrayerId];
      return { text: at.getTime() > now ? formatTime(at) : 'Not yet', dot: colors.dotOff, ink: colors.ink2 };
    }
    if (h.endOfDay && now < evening.getTime()) return { text: 'Tonight', dot: colors.dotOff, ink: colors.ink2 };
    return { text: 'Not yet', dot: colors.dotOff, ink: colors.ink2 };
  }

  const summary = (g: Group) => {
    const s = stats[g];
    const n = Math.floor(s.done + 1e-9);
    return g === 'soul' ? `${n} of ${s.total} prayers` : `${n} of ${s.total}`;
  };

  return (
    <Screen scroll>
      <View style={{ gap: 2, marginBottom: 18 }}>
        <Title>Today’s rings</Title>
        <T size={14} color={colors.muted}>
          {longDate(date)}
        </T>
      </View>

      <View style={{ alignItems: 'center', gap: 16, marginBottom: 6 }}>
        <Rings stats={stats} size={236} stroke={22} />
        <View style={{ flexDirection: 'row', gap: 20 }}>
          {shown.map((g) => (
            <View key={g} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: groupColor[g] }} />
              <T w="semibold" size={14}>
                {groupName[g]}
              </T>
            </View>
          ))}
        </View>
      </View>

      {shown.map((g) => (
        <View key={g} style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 14, marginTop: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <T w="display" size={20} accessibilityRole="header">
              {groupName[g]}
            </T>
            <T w="semibold" size={13} color={groupInk[g]}>
              {summary(g)}
            </T>
          </View>
          {habitsIn(g, settings).map((h) => {
            const st = status(h);
            return (
              <View key={h.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 36 }} accessible accessibilityLabel={`${h.name}, ${st.text}`}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: st.dot }} />
                <T size={15} color={st.ink} style={{ flex: 1 }} numberOfLines={1}>
                  {h.name}
                </T>
                <T size={13} color={colors.muted}>
                  {st.text}
                </T>
              </View>
            );
          })}
        </View>
      ))}
    </Screen>
  );
}
