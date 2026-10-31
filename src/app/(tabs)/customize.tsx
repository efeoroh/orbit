import Constants from 'expo-constants';
import { ReactNode, useState } from 'react';
import { Alert, Pressable, Share, Switch, View } from 'react-native';
import { Chips, Dropdown, MultiPick } from '../../components/pickers';
import { WorkoutSetup } from '../../components/WorkoutSetup';
import { MEDS, PASSIONS, QUIT_HABITS, SALT_LIMITS, WATER_GOALS, WORKOUTS, questionsFor } from '../../lib/catalog';
import { setSoundsEnabled, tap } from '../../lib/feedback';
import { LocationPicker } from '../../components/LocationPicker';
import { TimeField } from '../../components/TimeField';
import { Field, Screen, Segmented, T, Title } from '../../components/ui';
import { CALC_METHODS, FixedId, LEVEL_UP_DAYS, MAX_WORKOUTS, PRAYERS, PRAYER_NAMES, Settings, fmtNum, makeWorkout, newId, workoutTarget } from '../../lib/habits';
import { requestPermission } from '../../lib/notifications';
import { exportJson, updateSettings, useOrbit } from '../../lib/store';
import { colors, groupColor, groupName, type Group } from '../../lib/theme';

function Section({ title, color, children }: { title: string; color?: string; children: ReactNode }) {
  return (
    <View style={{ marginTop: 28, gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        {color ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} /> : null}
        <T w="display" size={19} accessibilityRole="header">
          {title}
        </T>
      </View>
      {children}
    </View>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <T w="semibold" size={13} color={colors.muted} style={{ marginTop: 10, marginBottom: 2 }}>
      {children}
    </T>
  );
}

function SwitchRow({ label, sub, value, onChange }: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }}>
      <View style={{ flex: 1 }}>
        <T size={15} color={value ? colors.ink : colors.muted}>
          {label}
        </T>
        {sub ? (
          <T size={12} color={colors.muted}>
            {sub}
          </T>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          tap();
          onChange(v);
        }} trackColor={{ true: colors.dark, false: colors.border }} accessibilityLabel={label} />
    </View>
  );
}

export default function Customize() {
  const { settings: s } = useOrbit();
  const set = (p: Partial<Settings>) => updateSettings(p);
  const [editLoc, setEditLoc] = useState(false);
  const [openWorkout, setOpenWorkout] = useState<string | null>(null);

  const on = (id: FixedId) => s.enabled[id] !== false;
  const toggle = (id: FixedId, v: boolean) => set({ enabled: { ...s.enabled, [id]: v } });

  const needPermission = async (v: boolean) => {
    if (v && !(await requestPermission())) {
      Alert.alert('Notifications are off', 'Turn on notifications for Orbit in the Settings app.');
      return false;
    }
    return true;
  };

  const color = (g: Group) => groupColor[g];

  return (
    <Screen scroll>
      <Title>Customize</Title>

      <Section title="You">
        <Field label="Name" defaultValue={s.name} onEndEditing={(e) => set({ name: e.nativeEvent.text.trim() })} autoCapitalize="words" />
      </Section>

      <Section title={`${groupName.body} ring`} color={color('body')}>
        <Label>Medication & vitamins</Label>
        <MultiPick
          options={MEDS}
          selected={s.meds.map((m) => m.name)}
          otherPlaceholder="e.g. a prescription"
          onToggle={(name, v) => set({ meds: v ? [...s.meds, { id: newId(), name }] : s.meds.filter((m) => m.name.toLowerCase() !== name.toLowerCase()) })}
          onAdd={(name) => set({ meds: [...s.meds, { id: newId(), name }] })}
          onRemove={(name) => set({ meds: s.meds.filter((m) => m.name !== name) })}
        />

        <Label>Workouts (up to {MAX_WORKOUTS})</Label>
        <MultiPick
          options={WORKOUTS.map((w) => w.name)}
          selected={s.workouts.map((w) => w.name)}
          max={MAX_WORKOUTS}
          otherPlaceholder="e.g. Burpees"
          onToggle={(name, v) => set({ workouts: v ? [...s.workouts, makeWorkout(name)] : s.workouts.filter((w) => w.name.toLowerCase() !== name.toLowerCase()) })}
          onAdd={(name) => set({ workouts: [...s.workouts, makeWorkout(name)] })}
          onRemove={(name) => set({ workouts: s.workouts.filter((w) => w.name !== name) })}
        />
        {s.workouts.map((w) => {
          const open = openWorkout === w.id;
          return (
            <View key={w.id} style={{ borderBottomWidth: 1, borderBottomColor: colors.line }}>
              <Pressable
                onPress={() => {
                  tap();
                  setOpenWorkout(open ? null : w.id);
                }}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                style={{ flexDirection: 'row', alignItems: 'center', minHeight: 52, gap: 10 }}
              >
                <View style={{ flex: 1 }}>
                  <T size={15}>{w.name}</T>
                  <T size={12} color={colors.muted}>
                    {workoutTarget(w)}
                    {w.levelUp ? ` · +${workoutTarget({ target: w.step, unit: w.unit })} every ${LEVEL_UP_DAYS}-day streak` : ''}
                  </T>
                </View>
                <T w="semibold" size={14}>
                  {open ? 'Done' : 'Edit'}
                </T>
              </Pressable>
              {open ? (
                <View style={{ paddingBottom: 18 }}>
                  <WorkoutSetup compact w={w} onChange={(nw) => set({ workouts: s.workouts.map((x) => (x.id === nw.id ? nw : x)) })} />
                </View>
              ) : null}
            </View>
          );
        })}

        <Label>Water</Label>
        <Chips
          options={WATER_GOALS}
          value={on('water') ? s.waterGoal : null}
          format={(n) => `${fmtNum(n)} L`}
          other={{ placeholder: 'Litres, e.g. 2.8', keyboard: 'decimal-pad', parse: (t) => { const n = parseFloat(t.replace(',', '.')); return Number.isFinite(n) && n > 0 ? n : null; } }}
          off="Don't track"
          onChange={(v) => set(v === null ? { enabled: { ...s.enabled, water: false } } : { waterGoal: v, enabled: { ...s.enabled, water: true } })}
        />

        <Label>Salt per dish</Label>
        <Chips
          options={SALT_LIMITS}
          value={on('sodium') ? s.saltLimit : null}
          other={{ placeholder: 'e.g. 1 pinch', parse: (t) => (t.trim() ? t.trim() : null) }}
          off="Don't track"
          onChange={(v) => set(v === null ? { enabled: { ...s.enabled, sodium: false } } : { saltLimit: v, enabled: { ...s.enabled, sodium: true } })}
        />

        <Label>Also in this ring</Label>
        <SwitchRow label="Skincare" value={on('skin')} onChange={(v) => toggle('skin', v)} />
        <SwitchRow label="No sugar" value={on('sugar')} onChange={(v) => toggle('sugar', v)} />
      </Section>

      <Section title={`${groupName.mind} ring`} color={color('mind')}>
        <View style={{ gap: 14 }}>
          <Dropdown
            label="Your passion"
            value={s.passionName}
            options={PASSIONS}
            placeholder="Choose your passion"
            otherPlaceholder="e.g. Dancing"
            noneLabel="None"
            onChange={(passionName) =>
              set({ passionName, passionPrompt: questionsFor(passionName)[0], enabled: { ...s.enabled, passion: !!passionName } })
            }
          />
          {s.passionName ? (
            <Dropdown
              key={s.passionName}
              label="Daily question"
              value={s.passionPrompt}
              options={questionsFor(s.passionName)}
              otherPlaceholder="Write your own question"
              onChange={(passionPrompt) => set({ passionPrompt })}
            />
          ) : null}
          <Dropdown
            label="Habit you're beating"
            value={s.quitLabel}
            options={QUIT_HABITS}
            otherPlaceholder="e.g. No energy drinks"
            noneLabel="Nothing right now"
            onChange={(quitLabel) => set({ quitLabel, enabled: { ...s.enabled, clean: !!quitLabel } })}
          />
        </View>
      </Section>

      <Section title={`${groupName.soul} ring`} color={color('soul')}>
        {PRAYERS.map((p) => (
          <SwitchRow key={p} label={PRAYER_NAMES[p]} value={on(p)} onChange={(v) => toggle(p, v)} />
        ))}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, marginTop: 6 }}>
          <View style={{ flex: 1 }}>
            <T size={15}>Location</T>
            <T size={12} color={colors.muted}>
              {s.location ? s.location.label : 'Not set · prayer times are off'}
            </T>
          </View>
          <Pressable onPress={() => { tap(); setEditLoc((x) => !x); }} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center', paddingLeft: 12 }}>
            <T w="semibold" size={14}>
              {editLoc ? 'Close' : 'Change'}
            </T>
          </Pressable>
        </View>
        {editLoc ? (
          <LocationPicker
            value={s.location}
            onChange={(location) => {
              set({ location });
              setEditLoc(false);
            }}
          />
        ) : null}
        <Label>Calculation method</Label>
        {CALC_METHODS.map((m) => {
          const sel = s.calcMethod === m.id;
          return (
            <Pressable key={m.id} onPress={() => { tap(); set({ calcMethod: m.id }); }} accessibilityRole="radio" accessibilityState={{ selected: sel }} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 42 }}>
              <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: sel ? colors.ink : colors.border, alignItems: 'center', justifyContent: 'center' }}>
                {sel ? <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.ink }} /> : null}
              </View>
              <T size={15}>{m.label}</T>
            </Pressable>
          );
        })}
        <Label>Asr time</Label>
        <Segmented label="Asr time" value={s.madhab} onChange={(madhab) => set({ madhab })} options={[{ id: 'shafi', label: 'Standard' }, { id: 'hanafi', label: 'Hanafi (later)' }]} />
      </Section>

      <Section title="Sound">
        <SwitchRow
          label="Sounds"
          sub="Chirps and taps, even when your phone is on silent"
          value={s.sounds !== false}
          onChange={(v) => {
            setSoundsEnabled(v);
            set({ sounds: v });
            if (v) tap();
          }}
        />
      </Section>

      <Section title="Reminders">
        <SwitchRow
          label="Prayer reminders"
          sub={s.location ? 'At each prayer time' : 'Set a location first'}
          value={s.prayerReminders && !!s.location}
          onChange={async (v) => (await needPermission(v)) && set({ prayerReminders: v })}
        />
        <SwitchRow label="Evening check-in" value={s.evening.enabled} onChange={async (v) => (await needPermission(v)) && set({ evening: { ...s.evening, enabled: v } })} />
        {s.evening.enabled ? <TimeField label="Remind me at" hour={s.evening.hour} minute={s.evening.minute} onChange={(hour, minute) => set({ evening: { ...s.evening, hour, minute } })} /> : null}
      </Section>

      <Section title="Your data">
        <T size={13} color={colors.muted}>
          Everything is stored on this phone. Export a copy any time.
        </T>
        <Pressable onPress={() => { tap(); Share.share({ message: exportJson() }); }} accessibilityRole="button" style={{ minHeight: 46, justifyContent: 'center' }}>
          <T w="semibold" size={15}>
            Export my data
          </T>
        </Pressable>
      </Section>

      <Section title="Setup">
        <T size={13} color={colors.muted}>
          Go through the welcome questions again. Your answers start filled in, and your history is kept.
        </T>
        <Pressable
          onPress={() => {
            tap();
            Alert.alert('Redo setup?', 'You’ll go through the welcome questions again. Your check-in history stays.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Redo setup', onPress: () => set({ onboarded: false }) },
            ]);
          }}
          accessibilityRole="button"
          style={{ minHeight: 46, justifyContent: 'center' }}
        >
          <T w="semibold" size={15}>
            Redo setup
          </T>
        </Pressable>
      </Section>

      <T size={12} color={colors.muted} style={{ textAlign: 'center', marginTop: 24 }}>
        Orbit {Constants.expoConfig?.version ?? ''}
      </T>
    </Screen>
  );
}
