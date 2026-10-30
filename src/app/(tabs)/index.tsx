import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { QuickLog } from '../../components/QuickLog';
import { TapCircle } from '../../components/TapCircle';
import { Button, Screen, Segmented, T } from '../../components/ui';
import { addDays, dateKey, fromKey } from '../../lib/dates';
import { useToday } from '../../lib/useToday';
import { CheckId, checkInSteps } from '../../lib/habits';
import { setCheck, useOrbit } from '../../lib/store';
import { colors, groupColor, groupName } from '../../lib/theme';

export default function CheckIn() {
  const { settings, days } = useOrbit();
  const [which, setWhich] = useState<'yesterday' | 'today'>('today');
  const today = useToday();
  const date = useMemo(() => addDays(fromKey(today), which === 'today' ? 0 : -1), [which, today]);
  const key = dateKey(date);
  const day = days[key];
  const steps = checkInSteps(settings);

  const firstOpen = () => {
    const i = steps.findIndex((h) => day?.checks[h.id as CheckId] === undefined);
    return i === -1 ? steps.length : i;
  };
  const [step, setStep] = useState(firstOpen);
  useEffect(() => setStep(firstOpen()), [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const finished = step >= steps.length;
  const cur = steps[Math.min(step, steps.length - 1)];

  function answer(v: boolean) {
    if (!cur) return;
    if (v) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setCheck(key, cur.id as CheckId, v);
    setStep((s) => s + 1);
  }

  const doneCount = steps.filter((h) => day?.checks[h.id as CheckId] === true).length;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ flexGrow: 1, gap: 16, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', height: 44 }}>
          <Pressable
            onPress={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            accessibilityRole="button"
            accessibilityLabel="Previous habit"
            style={{ width: 44, height: 44, justifyContent: 'center', opacity: step === 0 ? 0.3 : 1 }}
          >
            <T size={26} color={colors.ink} style={{ marginTop: -4 }}>
              ‹
            </T>
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center', gap: 6 }}>
            <View style={{ flexDirection: 'row', gap: 7 }} accessibilityElementsHidden>
              {steps.map((h, i) => {
                const v = day?.checks[h.id as CheckId];
                return (
                  <View
                    key={h.id}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: i === step ? colors.ink : v === true ? groupColor[h.group] : v === false ? colors.border : colors.dotOff,
                    }}
                  />
                );
              })}
            </View>
            <T size={12} color={colors.muted}>
              {finished ? 'All answered' : `${step + 1} of ${steps.length}`}
            </T>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <Segmented
          label="Which day"
          style={{ alignSelf: 'center', width: 220 }}
          value={which}
          onChange={setWhich}
          options={[
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'today', label: 'Today' },
          ]}
        />

        <QuickLog dayKey={key} date={date} day={day} settings={settings} />

        {!finished && cur ? (
          <View style={{ flex: 1, alignItems: 'center', gap: 26, paddingTop: 8 }}>
            <View style={{ alignItems: 'center', gap: 6 }} accessibilityLiveRegion="polite">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: groupColor[cur.group] }} />
                <T w="medium" size={12} color={colors.muted} style={{ letterSpacing: 0.6, textTransform: 'uppercase' }}>
                  {groupName[cur.group]}
                </T>
              </View>
              <T w="bold" size={30} style={{ letterSpacing: -0.6, textAlign: 'center' }}>
                {cur.label(settings)}
              </T>
              <T size={15} color={colors.muted} style={{ textAlign: 'center' }}>
                {cur.sub(settings)}
              </T>
            </View>
            <TapCircle size={210} onPress={() => answer(true)} label={`Mark ${cur.label(settings)} done`} />
            <Button label="Missed · next" kind="outline" onPress={() => answer(false)} style={{ minWidth: 200, minHeight: 48, borderRadius: 10 }} />
          </View>
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 24 }}>
            <T w="bold" size={26} style={{ letterSpacing: -0.5 }}>
              Check-in saved
            </T>
            <T size={15} color={colors.muted} style={{ textAlign: 'center' }}>
              {doneCount} of {steps.length} done{which === 'yesterday' ? ' yesterday' : ''}
            </T>
            <Button label={which === 'today' ? "See today's rings" : 'See progress'} onPress={() => router.navigate(which === 'today' ? '/rings' : '/progress')} style={{ minWidth: 220, marginTop: 12 }} />
            <Button label="Review answers" kind="text" onPress={() => setStep(0)} />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
