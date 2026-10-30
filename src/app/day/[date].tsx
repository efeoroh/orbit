import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Grain, Segmented, T } from '../../components/ui';
import { formatTime, fromKey, longDate, todayKey } from '../../lib/dates';
import { PrayerId, glasses, habitsIn } from '../../lib/habits';
import { prayerTimes } from '../../lib/prayer';
import { GROUPS, isLogged, ringStats } from '../../lib/rings';
import { setCheck, setWater, useOrbit } from '../../lib/store';
import { colors, groupColor, groupInk, groupName } from '../../lib/theme';

type Answer = 'done' | 'missed' | 'none';

export default function EditDay() {
  const { date: raw } = useLocalSearchParams<{ date: string }>();
  const key = /^\d{4}-\d{2}-\d{2}$/.test(String(raw)) ? String(raw) : todayKey();
  const { settings, days } = useOrbit();
  const day = days[key];
  const date = fromKey(key);
  const times = prayerTimes(settings, date);
  const stats = ringStats(day, settings);
  const total = glasses(settings);
  const count = Math.min(total, Math.round((day?.water ?? 0) / settings.glass));

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
          <T w="display" size={28}>
            {longDate(date)}
          </T>
          <T size={14} color={colors.muted} style={{ marginTop: 4 }}>
            {isLogged(day) ? 'Changes save as you tap' : 'Not logged yet · tap to fill it in'}
          </T>

          {GROUPS.map((g) => {
            const hs = habitsIn(g, settings);
            if (!hs.length) return null;
            return (
              <View key={g} style={{ marginTop: 22 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: groupColor[g] }} />
                    <T w="display" size={19} accessibilityRole="header">
                      {groupName[g]}
                    </T>
                  </View>
                  <T w="semibold" size={13} color={groupInk[g]}>
                    {Math.floor(stats[g].done + 1e-9)} of {stats[g].total}
                  </T>
                </View>
                {hs.map((h) => {
                  if (h.kind === 'water') {
                    return (
                      <View key={h.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, borderTopWidth: 1, borderTopColor: colors.line }}>
                        <T size={15} style={{ flex: 1 }}>
                          Water · {count} of {total} glasses
                        </T>
                        <Pressable onPress={() => setWater(key, (count - 1) * settings.glass)} disabled={count <= 0} accessibilityRole="button" accessibilityLabel="One glass less" style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', opacity: count <= 0 ? 0.4 : 1 }}>
                          <T size={18}>−</T>
                        </Pressable>
                        <Pressable onPress={() => setWater(key, Math.min(total, count + 1) * settings.glass)} disabled={count >= total} accessibilityRole="button" accessibilityLabel="One glass more" style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', opacity: count >= total ? 0.4 : 1 }}>
                          <T size={18}>+</T>
                        </Pressable>
                      </View>
                    );
                  }
                  const v = day?.checks[h.id];
                  const value: Answer = v === true ? 'done' : v === false ? 'missed' : 'none';
                  const sub = h.kind === 'prayer' && times ? formatTime(times[h.id as PrayerId]) : '';
                  return (
                    <View key={h.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, borderTopWidth: 1, borderTopColor: colors.line }}>
                      <View style={{ flex: 1 }}>
                        <T size={15} numberOfLines={1}>
                          {h.name}
                        </T>
                        {sub ? (
                          <T size={12} color={colors.muted}>
                            {sub}
                          </T>
                        ) : null}
                      </View>
                      <Segmented<Answer>
                        label={h.name}
                        style={{ width: 150 }}
                        value={value}
                        onChange={(a) => setCheck(key, h.id, a === value ? undefined : a === 'done')}
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
