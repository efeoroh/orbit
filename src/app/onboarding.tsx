import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LocationPicker } from '../components/LocationPicker';
import { Rings } from '../components/Rings';
import { TimeField } from '../components/TimeField';
import { Button, Field, Grain, Segmented, T, Title } from '../components/ui';
import { Chips, Dropdown, MultiPick } from '../components/pickers';
import { WorkoutSetup } from '../components/WorkoutSetup';
import { MEDS, PASSIONS, QUIT_HABITS, SALT_LIMITS, WATER_GOALS, WORKOUTS, questionsFor } from '../lib/catalog';
import { tap } from '../lib/feedback';
import { CALC_METHODS, MAX_WORKOUTS, Settings, fmtNum, makeWorkout, newId } from '../lib/habits';
import { requestPermission } from '../lib/notifications';
import { getState, updateSettings } from '../lib/store';
import { colors } from '../lib/theme';


export default function Onboarding() {
  const [i, setI] = useState(0);
  const [d, setD] = useState<Settings>(() => ({ ...getState().settings }));
  const set = (p: Partial<Settings>) => setD((x) => ({ ...x, ...p }));
  const STEPS = [
    'welcome',
    'name',
    'location',
    'prayer',
    'passion',
    ...(d.passionName ? ['question'] : []),
    'quit',
    'meds',
    'workouts',
    ...d.workouts.map((w) => `wo:${w.id}`),
    'water',
    'salt',
    'reminders',
  ];
  const step = STEPS[Math.min(i, STEPS.length - 1)];
  const workout = step.startsWith('wo:') ? d.workouts.find((w) => `wo:${w.id}` === step) : undefined;

  const next = () => setI((x) => Math.min(x + 1, STEPS.length - 1));
  const back = () => {
    tap();
    setI((x) => Math.max(x - 1, 0));
  };

  async function finish() {
    await requestPermission();
    updateSettings({
      ...d,
      meds: d.meds.filter((m) => m.name.trim()),
      enabled: { ...d.enabled, passion: !!d.passionName, clean: !!d.quitLabel },
      onboarded: true,
    });
    router.replace('/');
  }

  const canNext = step !== 'name' || d.name.trim().length > 0;
  const skippable = (step === 'passion' && !d.passionName) || (step === 'quit' && !d.quitLabel) || (step === 'location' && !d.location);

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
            <View style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.dotOff, marginHorizontal: 16, overflow: 'hidden' }} accessibilityLabel={`Step ${i + 1} of ${STEPS.length}`}>
              <View style={{ width: `${((i + 1) / STEPS.length) * 100}%`, height: 5, borderRadius: 3, backgroundColor: colors.ink }} />
            </View>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView key={step} contentContainerStyle={{ padding: 20, gap: 22, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
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
                        onPress={() => {
                          tap();
                          set({ calcMethod: m.id });
                        }}
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

            {step === 'passion' && (
              <>
                <Title>What's your passion?</Title>
                <T size={15} color={colors.ink2}>
                  The thing you want to show up for every day. It's half of your Mind ring.
                </T>
                <Dropdown
                  value={d.passionName}
                  options={PASSIONS}
                  placeholder="Choose your passion"
                  otherPlaceholder="e.g. Dancing"
                  onChange={(passionName) => set({ passionName, passionPrompt: questionsFor(passionName)[0] })}
                />
              </>
            )}

            {step === 'question' && (
              <>
                <Title>Your daily question</Title>
                <T size={15} color={colors.ink2}>
                  What should count as showing up for {d.passionName.toLowerCase()}?
                </T>
                <Dropdown
                  value={d.passionPrompt}
                  options={questionsFor(d.passionName)}
                  placeholder="Choose a question"
                  otherPlaceholder="Write your own question"
                  onChange={(passionPrompt) => set({ passionPrompt })}
                />
              </>
            )}

            {step === 'quit' && (
              <>
                <Title>A habit you're beating</Title>
                <T size={15} color={colors.ink2}>
                  The other half of your Mind ring. You confirm it at the end of each day.
                </T>
                <Dropdown
                  value={d.quitLabel}
                  options={QUIT_HABITS}
                  placeholder="Choose one"
                  otherPlaceholder="e.g. No energy drinks"
                  noneLabel="Nothing right now"
                  onChange={(quitLabel) => set({ quitLabel })}
                />
              </>
            )}

            {step === 'meds' && (
              <>
                <Title>Medication & vitamins</Title>
                <T size={15} color={colors.ink2}>
                  Tick everything you take daily. Each one gets its own check-in. None? Just continue.
                </T>
                <MultiPick
                  options={MEDS}
                  selected={d.meds.map((m) => m.name)}
                  otherPlaceholder="e.g. a prescription"
                  onToggle={(name, on) =>
                    set({ meds: on ? [...d.meds, { id: newId(), name }] : d.meds.filter((m) => m.name.toLowerCase() !== name.toLowerCase()) })
                  }
                  onAdd={(name) => set({ meds: [...d.meds, { id: newId(), name }] })}
                  onRemove={(name) => set({ meds: d.meds.filter((m) => m.name !== name) })}
                />
              </>
            )}

            {step === 'workouts' && (
              <>
                <Title>Daily workouts</Title>
                <T size={15} color={colors.ink2}>
                  Choose up to {MAX_WORKOUTS}. Next, you'll set a target for each.
                </T>
                <MultiPick
                  options={WORKOUTS.map((w) => w.name)}
                  selected={d.workouts.map((w) => w.name)}
                  max={MAX_WORKOUTS}
                  otherPlaceholder="e.g. Burpees"
                  onToggle={(name, on) =>
                    set({ workouts: on ? [...d.workouts, makeWorkout(name)] : d.workouts.filter((w) => w.name.toLowerCase() !== name.toLowerCase()) })
                  }
                  onAdd={(name) => set({ workouts: [...d.workouts, makeWorkout(name)] })}
                  onRemove={(name) => set({ workouts: d.workouts.filter((w) => w.name !== name) })}
                />
              </>
            )}

            {workout && (
              <>
                <Title>{workout.name}</Title>
                <WorkoutSetup w={workout} onChange={(w) => set({ workouts: d.workouts.map((x) => (x.id === w.id ? w : x)) })} />
              </>
            )}

            {step === 'water' && (
              <>
                <Title>Water</Title>
                <T size={15} color={colors.ink2}>
                  How much do you want to drink a day? You'll log it a glass at a time.
                </T>
                <Chips
                  options={WATER_GOALS}
                  value={d.enabled.water ? d.waterGoal : null}
                  format={(n) => `${fmtNum(n)} L`}
                  other={{ placeholder: 'Litres, e.g. 2.8', keyboard: 'decimal-pad', parse: (t) => { const n = parseFloat(t.replace(',', '.')); return Number.isFinite(n) && n > 0 ? n : null; } }}
                  off="Don't track"
                  onChange={(v) => set(v === null ? { enabled: { ...d.enabled, water: false } } : { waterGoal: v, enabled: { ...d.enabled, water: true } })}
                />
                <T size={13} color={colors.muted}>
                  A common guideline is about 3 L a day from drinks for adult men and about 2.2 L for women.
                </T>
              </>
            )}

            {step === 'salt' && (
              <>
                <Title>Salt</Title>
                <T size={15} color={colors.ink2}>
                  Your limit per dish. You'll confirm it at the end of the day.
                </T>
                <Chips
                  options={SALT_LIMITS}
                  value={d.enabled.sodium ? d.saltLimit : null}
                  other={{ placeholder: 'e.g. 1 pinch', parse: (t) => (t.trim() ? t.trim() : null) }}
                  off="Don't track"
                  onChange={(v) => set(v === null ? { enabled: { ...d.enabled, sodium: false } } : { saltLimit: v, enabled: { ...d.enabled, sodium: true } })}
                />
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
                    onValueChange={(prayerReminders) => {
                      tap();
                      set({ prayerReminders });
                    }}
                    trackColor={{ true: colors.dark, false: colors.border }}
                    accessibilityLabel="Prayer reminders"
                  />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52 }}>
                  <T size={15}>Evening check-in reminder</T>
                  <Switch
                    value={d.evening.enabled}
                    onValueChange={(enabled) => {
                      tap();
                      set({ evening: { ...d.evening, enabled } });
                    }}
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
                label={step === 'welcome' ? 'Get started' : skippable ? 'Skip for now' : 'Continue'}
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
