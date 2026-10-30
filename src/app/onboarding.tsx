import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LocationPicker } from '../components/LocationPicker';
import { Rings } from '../components/Rings';
import { TimeField } from '../components/TimeField';
import { Button, Field, Grain, Segmented, T, Title } from '../components/ui';
import { CALC_METHODS, MAX_WORKOUTS, Settings } from '../lib/habits';
import { ListEditor, cleanList } from '../components/ListEditor';
import { requestPermission } from '../lib/notifications';
import { getState, updateSettings } from '../lib/store';
import { colors } from '../lib/theme';

const STEPS = ['welcome', 'name', 'location', 'prayer', 'mind', 'meds', 'workouts', 'body', 'reminders'] as const;

function num(v: string, fallback: number) {
  const n = parseFloat(v.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export default function Onboarding() {
  const [i, setI] = useState(0);
  const [d, setD] = useState<Settings>(() => ({ ...getState().settings }));
  const set = (p: Partial<Settings>) => setD((x) => ({ ...x, ...p }));
  const step = STEPS[i];

  const next = () => setI((x) => Math.min(x + 1, STEPS.length - 1));
  const back = () => setI((x) => Math.max(x - 1, 0));

  async function finish() {
    await requestPermission();
    updateSettings({ ...d, meds: cleanList(d.meds), workouts: cleanList(d.workouts), onboarded: true });
    router.replace('/');
  }

  const canNext = step !== 'name' || d.name.trim().length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 48 }}>
            {i > 0 ? (
              <Pressable onPress={back} accessibilityRole="button" accessibilityLabel="Back" style={{ minWidth: 44, minHeight: 44, justifyContent: 'center' }}>
                <T size={15} color={colors.ink2}>
                  Back
                </T>
              </Pressable>
            ) : (
              <View style={{ width: 44 }} />
            )}
            <View style={{ flexDirection: 'row', gap: 6 }} accessibilityLabel={`Step ${i + 1} of ${STEPS.length}`}>
              {STEPS.map((s, k) => (
                <View key={s} style={{ width: k === i ? 18 : 7, height: 7, borderRadius: 4, backgroundColor: k <= i ? colors.ink : colors.dotOff }} />
              ))}
            </View>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 22, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            {step === 'welcome' && (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 }}>
                <Rings
                  stats={{
                    body: { done: 5, total: 6, frac: 0.85 },
                    mind: { done: 2, total: 2, frac: 1 },
                    soul: { done: 3, total: 5, frac: 0.6 },
                  }}
                  size={220}
                  stroke={19}
                />
                <T w="display" size={44}>Orbit</T>
                <T w="medium" size={16} color={colors.ink2} style={{ letterSpacing: 2 }}>body.mind.soul.</T>
                <T size={16} color={colors.ink2} style={{ textAlign: 'center', maxWidth: 300 }}>
                  Three daily rings for body, mind and soul. Close them by showing up.
                </T>
              </View>
            )}

            {step === 'name' && (
              <>
                <Title>What should we call you?</Title>
                <Field label="Your name" value={d.name} onChangeText={(name) => set({ name })} autoFocus autoCapitalize="words" returnKeyType="next" onSubmitEditing={() => canNext && next()} />
              </>
            )}

            {step === 'location' && (
              <>
                <Title>Where are you?</Title>
                <T size={15} color={colors.ink2}>
                  Used to work out your daily prayer times and when to remind you.
                </T>
                <LocationPicker value={d.location} onChange={(location) => set({ location })} />
              </>
            )}

            {step === 'prayer' && (
              <>
                <Title>Prayer times</Title>
                <T size={15} color={colors.ink2}>
                  Pick the calculation your mosque uses. Not sure? Keep the default.
                </T>
                <View style={{ gap: 2 }}>
                  {CALC_METHODS.map((m) => {
                    const on = d.calcMethod === m.id;
                    return (
                      <Pressable
                        key={m.id}
                        onPress={() => set({ calcMethod: m.id })}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: on }}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 46, borderBottomWidth: 1, borderBottomColor: colors.line }}
                      >
                        <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: on ? colors.ink : colors.border, alignItems: 'center', justifyContent: 'center' }}>
                          {on ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.ink }} /> : null}
                        </View>
                        <T size={15}>{m.label}</T>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={{ gap: 8 }}>
                  <T w="semibold" size={14}>
                    Asr time
                  </T>
                  <Segmented
                    label="Asr time"
                    value={d.madhab}
                    onChange={(madhab) => set({ madhab })}
                    options={[
                      { id: 'shafi', label: 'Standard' },
                      { id: 'hanafi', label: 'Hanafi (later)' },
                    ]}
                  />
                </View>
              </>
            )}

            {step === 'mind' && (
              <>
                <Title>Mind</Title>
                <T size={15} color={colors.ink2}>
                  Your Mind ring is your passion plus one habit you're beating.
                </T>
                <Field label="Your passion" value={d.passionName} onChangeText={(passionName) => set({ passionName })} placeholder="Music" />
                <Field label="Daily question" value={d.passionPrompt} onChangeText={(passionPrompt) => set({ passionPrompt })} placeholder="Did you make a track today?" />
                <Field label="Habit you're beating" value={d.quitLabel} onChangeText={(quitLabel) => set({ quitLabel })} placeholder="No PMO" />
              </>
            )}

            {step === 'meds' && (
              <>
                <Title>Medication & vitamins</Title>
                <T size={15} color={colors.ink2}>
                  Add each one you take daily. Each gets its own check-in. Skip if none.
                </T>
                <ListEditor
                  items={d.meds}
                  onChange={(meds) => set({ meds })}
                  namePlaceholder="e.g. Finasteride"
                  detailPlaceholder="Dose or note (optional)"
                  addLabel={d.meds.length ? 'Add another' : 'Add one'}
                />
              </>
            )}

            {step === 'workouts' && (
              <>
                <Title>Daily workouts</Title>
                <T size={15} color={colors.ink2}>
                  Pick up to {MAX_WORKOUTS}. Each one is its own check-in.
                </T>
                <ListEditor
                  items={d.workouts}
                  onChange={(workouts) => set({ workouts })}
                  namePlaceholder="e.g. Push-ups"
                  detailPlaceholder="Target, e.g. 20 reps"
                  addLabel="Add a workout"
                  max={MAX_WORKOUTS}
                />
              </>
            )}

            {step === 'body' && (
              <>
                <Title>Water & salt</Title>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Field label="Water goal (L)" keyboardType="decimal-pad" defaultValue={String(d.waterGoal)} onChangeText={(v) => set({ waterGoal: num(v, d.waterGoal) || 3 })} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label="Salt per dish" value={d.saltLimit} onChangeText={(saltLimit) => set({ saltLimit })} />
                  </View>
                </View>
                <T size={13} color={colors.muted}>
                  A common guideline is about 3 L of water a day from drinks for adult men, and about 2.2 L for women. Water is logged in glasses of {d.glass} L.
                </T>
              </>
            )}

            {step === 'reminders' && (
              <>
                <Title>Reminders</Title>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52 }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <T size={15}>Prayer reminders</T>
                    <T size={13} color={colors.muted}>
                      {d.location ? `At each prayer time in ${d.location.label}` : 'Add a location to turn these on'}
                    </T>
                  </View>
                  <Switch
                    value={d.prayerReminders && !!d.location}
                    disabled={!d.location}
                    onValueChange={(prayerReminders) => set({ prayerReminders })}
                    trackColor={{ true: colors.dark, false: colors.border }}
                    accessibilityLabel="Prayer reminders"
                  />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52 }}>
                  <T size={15}>Evening check-in reminder</T>
                  <Switch
                    value={d.evening.enabled}
                    onValueChange={(enabled) => set({ evening: { ...d.evening, enabled } })}
                    trackColor={{ true: colors.dark, false: colors.border }}
                    accessibilityLabel="Evening check-in reminder"
                  />
                </View>
                {d.evening.enabled ? (
                  <TimeField label="Remind me at" hour={d.evening.hour} minute={d.evening.minute} onChange={(hour, minute) => set({ evening: { ...d.evening, hour, minute } })} />
                ) : null}
                <T size={13} color={colors.muted}>
                  Next, your phone will ask to allow notifications. You can change all of this later in Customize.
                </T>
              </>
            )}
          </ScrollView>

          <View style={{ padding: 20, paddingTop: 8 }}>
            {step === 'reminders' ? (
              <Button label={d.name ? `Let's go, ${d.name.trim().split(' ')[0]}` : "Let's go"} onPress={finish} />
            ) : (
              <Button
                label={step === 'welcome' ? 'Get started' : step === 'location' && !d.location ? 'Skip for now' : 'Continue'}
                onPress={next}
                disabled={!canNext}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <Grain />
    </View>
  );
}
