import Constants from 'expo-constants';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Share, Switch, View } from 'react-native';
import { ListEditor, cleanList } from '../../components/ListEditor';
import { LocationPicker } from '../../components/LocationPicker';
import { TimeField } from '../../components/TimeField';
import { Field, Screen, Segmented, T, Title } from '../../components/ui';
import { CALC_METHODS, FixedId, ListItem, MAX_WORKOUTS, PRAYERS, PRAYER_NAMES, Settings, fmtNum } from '../../lib/habits';
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
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.dark, false: colors.border }} accessibilityLabel={label} />
    </View>
  );
}

function NumField({ label, value, onCommit }: { label: string; value: number; onCommit: (n: number) => void }) {
  return (
    <View style={{ flex: 1 }}>
      <Field
        label={label}
        defaultValue={fmtNum(value)}
        keyboardType="decimal-pad"
        onEndEditing={(e) => {
          const n = parseFloat(e.nativeEvent.text.replace(',', '.'));
          if (Number.isFinite(n) && n > 0) onCommit(n);
        }}
      />
    </View>
  );
}

/** Edits a list locally and saves it (without blank rows) shortly after typing stops. */
function useListDraft(saved: ListItem[], save: (items: ListItem[]) => void) {
  const [draft, setDraft] = useState(saved);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const change = (items: ListItem[]) => {
    setDraft(items);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => save(cleanList(items)), 500);
  };
  return [draft, change] as const;
}

export default function Customize() {
  const { settings: s } = useOrbit();
  const set = (p: Partial<Settings>) => updateSettings(p);
  const [editLoc, setEditLoc] = useState(false);
  const [meds, setMeds] = useListDraft(s.meds, (meds) => set({ meds }));
  const [workouts, setWorkouts] = useListDraft(s.workouts, (workouts) => set({ workouts }));

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
        <ListEditor items={meds} onChange={setMeds} namePlaceholder="e.g. Finasteride" detailPlaceholder="Dose or note (optional)" addLabel={meds.length ? 'Add another' : 'Add one'} />
        <Label>Workouts (up to {MAX_WORKOUTS})</Label>
        <ListEditor items={workouts} onChange={setWorkouts} namePlaceholder="e.g. Push-ups" detailPlaceholder="Target, e.g. 20 reps" addLabel="Add a workout" max={MAX_WORKOUTS} />
        <Label>Also in this ring</Label>
        <SwitchRow label="Skincare" value={on('skin')} onChange={(v) => toggle('skin', v)} />
        <SwitchRow label="Low sodium" sub={`${s.saltLimit} salt per dish`} value={on('sodium')} onChange={(v) => toggle('sodium', v)} />
        <SwitchRow label="No sugar" value={on('sugar')} onChange={(v) => toggle('sugar', v)} />
        <SwitchRow label="Water" sub={`${fmtNum(s.waterGoal)} L in ${fmtNum(s.glass)} L glasses`} value={on('water')} onChange={(v) => toggle('water', v)} />
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
          <NumField label="Water goal (L)" value={s.waterGoal} onCommit={(waterGoal) => set({ waterGoal })} />
          <NumField label="Glass size (L)" value={s.glass} onCommit={(glass) => set({ glass })} />
        </View>
        <View style={{ marginTop: 12 }}>
          <Field label="Salt limit per dish" defaultValue={s.saltLimit} onEndEditing={(e) => set({ saltLimit: e.nativeEvent.text.trim() || '¼ tsp' })} />
        </View>
      </Section>

      <Section title={`${groupName.mind} ring`} color={color('mind')}>
        <SwitchRow label={s.passionName || 'Passion'} value={on('passion')} onChange={(v) => toggle('passion', v)} />
        <SwitchRow label={s.quitLabel || 'Stayed clean'} value={on('clean')} onChange={(v) => toggle('clean', v)} />
        <View style={{ gap: 12, marginTop: 6 }}>
          <Field label="Your passion" defaultValue={s.passionName} onEndEditing={(e) => set({ passionName: e.nativeEvent.text.trim() || 'Passion' })} />
          <Field label="Daily question" defaultValue={s.passionPrompt} onEndEditing={(e) => set({ passionPrompt: e.nativeEvent.text.trim() })} />
          <Field label="Habit you're beating" defaultValue={s.quitLabel} onEndEditing={(e) => set({ quitLabel: e.nativeEvent.text.trim() || 'Stayed clean' })} />
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
          <Pressable onPress={() => setEditLoc((x) => !x)} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center', paddingLeft: 12 }}>
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
            <Pressable key={m.id} onPress={() => set({ calcMethod: m.id })} accessibilityRole="radio" accessibilityState={{ selected: sel }} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 42 }}>
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
        <Pressable onPress={() => Share.share({ message: exportJson() })} accessibilityRole="button" style={{ minHeight: 46, justifyContent: 'center' }}>
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
          onPress={() =>
            Alert.alert('Redo setup?', 'You’ll go through the welcome questions again. Your check-in history stays.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Redo setup', onPress: () => set({ onboarded: false }) },
            ])
          }
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
