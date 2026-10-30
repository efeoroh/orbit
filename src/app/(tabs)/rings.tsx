import { View } from 'react-native';
import { Rings } from '../../components/Rings';
import { Screen, T, Title } from '../../components/ui';
import { formatTime, fromKey, longDate } from '../../lib/dates';
import { CheckId, HabitDef, PrayerId, fmtNum, habitsIn } from '../../lib/habits';
import { prayerTimes } from '../../lib/prayer';
import { ringStats } from '../../lib/rings';
import { useOrbit } from '../../lib/store';
import { useToday } from '../../lib/useToday';
import { colors, groupColor, groupName, type Group } from '../../lib/theme';

const GROUPS: Group[] = ['body', 'mind', 'soul'];

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

  function status(h: HabitDef): { text: string; done: boolean; partial?: boolean } {
    if (h.kind === 'water') {
      const w = day?.water ?? 0;
      return { text: `${fmtNum(w)} of ${fmtNum(settings.waterGoal)} L`, done: w >= settings.waterGoal, partial: w > 0 };
    }
    const v = day?.checks[h.id as CheckId | PrayerId];
    if (v === true) return { text: 'Done', done: true };
    if (v === false) return { text: 'Missed', done: false };
    if (h.kind === 'prayer' && times) {
      const at = times[h.id as PrayerId];
      return { text: at.getTime() > now ? formatTime(at) : 'Not yet', done: false };
    }
    if (h.endOfDay && now < evening.getTime()) return { text: 'Tonight', done: false };
    return { text: 'Not yet', done: false };
  }

  const summary = (g: Group) => {
    const s = stats[g];
    return g === 'soul' ? `${fmtNum(s.done)} of ${s.total} prayers` : `${fmtNum(s.done)} of ${s.total}`;
  };

  return (
    <Screen scroll>
      <View style={{ gap: 4, marginBottom: 18 }}>
        <Title>Today’s rings</Title>
        <T size={14} color={colors.muted}>
          {longDate(date)}
        </T>
      </View>

      <View style={{ alignItems: 'center', gap: 16, marginBottom: 8 }}>
        <Rings stats={stats} size={232} stroke={20} />
        <View style={{ flexDirection: 'row', gap: 20 }}>
          {GROUPS.filter((g) => stats[g].total > 0).map((g) => (
            <View key={g} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: groupColor[g] }} />
              <T size={13} color={colors.ink2}>
                {groupName[g]}
              </T>
            </View>
          ))}
        </View>
      </View>

      {GROUPS.filter((g) => stats[g].total > 0).map((g) => (
        <View key={g} style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 14, marginTop: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <T w="bold" size={17} accessibilityRole="header">
              {groupName[g]}
            </T>
            <T size={13} color={colors.muted}>
              {summary(g)}
            </T>
          </View>
          {habitsIn(g, settings).map((h) => {
            const st = status(h);
            return (
              <View key={h.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 36 }} accessible accessibilityLabel={`${h.label(settings)}, ${st.text}`}>
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: st.done ? groupColor[g] : st.partial ? `${groupColor[g]}88` : colors.dotOff,
                  }}
                />
                <T size={14} color={st.done ? colors.ink : colors.ink2} style={{ flex: 1 }} numberOfLines={1}>
                  {h.label(settings)}
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
