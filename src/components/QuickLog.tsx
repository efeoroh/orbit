import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';
import { formatTime } from '../lib/dates';
import { DayLog, PRAYERS, PRAYER_NAMES, Settings, fmtNum } from '../lib/habits';
import { prayerTimes } from '../lib/prayer';
import { setCheck, setWater } from '../lib/store';
import { colors } from '../lib/theme';
import { T } from './ui';

/** Prayers and water: logged through the day rather than in the evening check-in. */
export function QuickLog({ dayKey, date, day, settings }: { dayKey: string; date: Date; day: DayLog | undefined; settings: Settings }) {
  const prayers = PRAYERS.filter((p) => settings.enabled[p] !== false);
  const times = prayerTimes(settings, date);
  const water = day?.water ?? 0;
  const showWater = settings.enabled.water !== false;

  if (!prayers.length && !showWater) return null;

  return (
    <View style={{ gap: 12, paddingVertical: 14, paddingHorizontal: 14, backgroundColor: 'rgba(251,250,247,0.7)', borderRadius: 16, borderWidth: 1, borderColor: colors.line }}>
      {prayers.length ? (
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {prayers.map((p) => {
            const done = day?.checks[p] === true;
            return (
              <Pressable
                key={p}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setCheck(dayKey, p, done ? undefined : true);
                }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: done }}
                accessibilityLabel={`${PRAYER_NAMES[p]}${times ? ` at ${formatTime(times[p])}` : ''}`}
                style={{
                  flex: 1,
                  minHeight: 50,
                  borderRadius: 11,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  borderWidth: 1,
                  borderColor: done ? colors.soul : colors.line,
                  backgroundColor: done ? 'rgba(161,144,188,0.32)' : 'transparent',
                }}
              >
                <T w="semibold" size={12}>
                  {PRAYER_NAMES[p]}
                </T>
                <T size={10} color={colors.ink2}>
                  {times ? formatTime(times[p]) : ' '}
                </T>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      {showWater ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T size={13}>Water</T>
              <T size={13} color={colors.ink2}>
                {fmtNum(water)} / {fmtNum(settings.waterGoal)} L
              </T>
            </View>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.line, overflow: 'hidden' }}>
              <View style={{ height: 6, width: `${Math.min(water / (settings.waterGoal || 1), 1) * 100}%`, backgroundColor: colors.body, borderRadius: 3 }} />
            </View>
          </View>
          <Pressable
            onPress={() => setWater(dayKey, water - settings.waterStep)}
            disabled={water <= 0}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${fmtNum(settings.waterStep)} litres`}
            style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', opacity: water <= 0 ? 0.4 : 1 }}
          >
            <T size={18}>−</T>
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setWater(dayKey, water + settings.waterStep);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Add ${fmtNum(settings.waterStep)} litres`}
            style={{ minHeight: 40, paddingHorizontal: 12, borderRadius: 20, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' }}
          >
            <T w="semibold" size={13} color={colors.onDark}>
              +{fmtNum(settings.waterStep)} L
            </T>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
