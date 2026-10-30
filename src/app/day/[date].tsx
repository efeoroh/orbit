import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Grain, Segmented, T } from '../../components/ui';
import { formatTime, fromKey, longDate, todayKey } from '../../lib/dates';
import { CheckId, PrayerId, fmtNum, habitsIn } from '../../lib/habits';
import { prayerTimes } from '../../lib/prayer';
import { ringStats } from '../../lib/rings';
import { setCheck, setWater, useOrbit } from '../../lib/store';
import { colors, groupColor, groupName, type Group } from '../../lib/theme';

type Answer = 'done' | 'missed' | 'none';

export default function EditDay() {
  const { date: raw } = useLocalSearchParams<{ date: string }>();
  const key = /^\d{4}-\d{2}-\d{2}$/.test(String(raw)) ? String(raw) : todayKey();
  const { settings, days } = useOrbit();
  const day = days[key];
  const date = fromKey(key);
  const times = prayerTimes(settings, date);
  const stats = ringStats(day, settings);
  const answered = Object.keys(day?.checks ?? {}).length > 0 || (day?.water ?? 0) > 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 52 }}>
          <View style={{ width: 60 }} />
          <T w="semibold" size={15}>
            Edit day
          </T>
          <Pressable onPress={() => router.back()} accessibilityRole="button" style={{ minWidth: 60, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' }}>
            <T w="semibold" size={15}>
              Done
            </T>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          <T w="bold" size={28} style={{ letterSpacing: -0.5 }}>
            {longDate(date)}
          </T>
          <T size={14} color={colors.muted} style={{ marginTop: 4 }}>
            {answered ? 'Changes save as you tap' : 'Not logged yet · tap to fill it in'}
          </T>

          {(['body', 'mind', 'soul'] as Group[]).map((g) => {
            const hs = habitsIn(g, settings);
            if (!hs.length) return null;
            return (
              <View key={g} style={{ marginTop: 22 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: groupColor[g] }} />
                    <T w="bold" size={17} accessibilityRole="header">
                      {groupName[g]}
                    </T>
                  </View>
                  <T size={13} color={colors.muted}>
                    {fmtNum(stats[g].done)} of {stats[g].total}
                  </T>
                </View>
                {hs.map((h) => {
                  if (h.kind === 'water') {
                    const w = day?.water ?? 0;
                    return (
                      <View key={h.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, borderTopWidth: 1, borderTopColor: colors.line }}>
                        <T size={14} style={{ flex: 1 }}>
                          Water · {fmtNum(w)} of {fmtNum(settings.waterGoal)} L
                        </T>
                        <Pressable onPress={() => setWater(key, w - settings.waterStep)} disabled={w <= 0} accessibilityRole="button" accessibilityLabel="Less water" style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', opacity: w <= 0 ? 0.4 : 1 }}>
                          <T size={18}>−</T>
                        </Pressable>
                        <Pressable onPress={() => setWater(key, w + settings.waterStep)} accessibilityRole="button" accessibilityLabel="More water" style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
                          <T size={18}>+</T>
                        </Pressable>
                      </View>
                    );
                  }
                  const id = h.id as CheckId | PrayerId;
                  const v = day?.checks[id];
                  const value: Answer = v === true ? 'done' : v === false ? 'missed' : 'none';
                  const sub = h.kind === 'prayer' && times ? formatTime(times[id as PrayerId]) : '';
                  return (
                    <View key={h.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, borderTopWidth: 1, borderTopColor: colors.line }}>
                      <View style={{ flex: 1 }}>
                        <T size={14} numberOfLines={1}>
                          {h.label(settings)}
                        </T>
                        {sub ? (
                          <T size={12} color={colors.muted}>
                            {sub}
                          </T>
                        ) : null}
                      </View>
                      <Segmented<Answer>
                        label={h.label(settings)}
                        style={{ width: 150 }}
                        value={value}
                        onChange={(a) => setCheck(key, id, a === value ? undefined : a === 'done')}
                        options={[
                          { id: 'done', label: 'Done' },
                          { id: 'missed', label: 'Missed' },
                        ]}
                      />
                    </View>
                  );
                })}
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
      <Grain />
    </View>
  );
}
