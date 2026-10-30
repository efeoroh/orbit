import Constants from 'expo-constants';
import { ReactNode, useState } from 'react';
import { Alert, Pressable, Share, Switch, View } from 'react-native';
import { LocationPicker } from '../../components/LocationPicker';
import { TimeField } from '../../components/TimeField';
import { Field, Screen, Segmented, T, Title } from '../../components/ui';
import { CALC_METHODS, HABITS, Settings, fmtNum } from '../../lib/habits';
import { requestPermission } from '../../lib/notifications';
import { exportJson, updateSettings, useOrbit } from '../../lib/store';
import { colors, groupColor, groupName, type Group } from '../../lib/theme';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ marginTop: 26, gap: 2 }}>
      <T w="semibold" size={14} style={{ marginBottom: 6 }} accessibilityRole="header">
        {title}
      </T>
      {children}
    </View>
  );
}

function SwitchRow({ label, sub, value, onChange, dot }: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void; dot?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 46 }}>
      {dot ? <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: dot, opacity: value ? 1 : 0.4 }} /> : null}
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

function NumField({ label, value, onCommit, decimal }: { label: string; value: number; onCommit: (n: number) => void; decimal?: boolean }) {
  return (
    <View style={{ flex: 1 }}>
      <Field
        label={label}
        defaultValue={fmtNum(value)}
        keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
        onEndEditing={(e) => {
          const n = parseFloat(e.nativeEvent.text.replace(',', '.'));
          if (Number.isFinite(n) && n > 0) onCommit(decimal ? n : Math.round(n));
        }}
      />
    </View>
  );
}

export default function Customize() {
  const { settings: s } = useOrbit();
  const set = (p: Partial<Settings>) => updateSettings(p);
  const [editLoc, setEditLoc] = useState(false);

  const toggleHabit = (id: keyof Settings['enabled'], v: boolean) => set({ enabled: { ...s.enabled, [id]: v } });

  return (
    <Screen scroll>
      <Title>Customize</Title>

      <Section title="You">
        <Field label="Name" defaultValue={s.name} onEndEditing={(e) => set({ name: e.nativeEvent.text.trim() })} autoCapitalize="words" />
      </Section>

      {(['body', 'mind', 'soul'] as Group[]).map((g) => (
        <Section key={g} title={`${groupName[g]} ring`}>
          {HABITS.filter((h) => h.group === g).map((h) => (
            <SwitchRow key={h.id} dot={groupColor[g]} label={h.label(s)} value={s.enabled[h.id] !== false} onChange={(v) => toggleHabit(h.id, v)} />
          ))}
          {g === 'body' && (
            <View style={{ gap: 12, marginTop: 8 }}>
              <Field label="Name for your daily meds" defaultValue={s.medsLabel} onEndEditing={(e) => set({ medsLabel: e.nativeEvent.text.trim() || 'Vitamins / Medication' })} />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <NumField label="Water goal (L)" decimal value={s.waterGoal} onCommit={(waterGoal) => set({ waterGoal })} />
                <NumField label="Water step (L)" decimal value={s.waterStep} onCommit={(waterStep) => set({ waterStep })} />
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <NumField label="Push-ups" value={s.pushups} onCommit={(pushups) => set({ pushups })} />
                <NumField label="Plank (sec)" value={s.plankSec} onCommit={(plankSec) => set({ plankSec })} />
              </View>
              <Field label="Salt limit per dish" defaultValue={s.saltLimit} onEndEditing={(e) => set({ saltLimit: e.nativeEvent.text.trim() || '¼ tsp' })} />
            </View>
          )}
          {g === 'mind' && (
            <View style={{ gap: 12, marginTop: 8 }}>
              <Field label="Your passion" defaultValue={s.passionName} onEndEditing={(e) => set({ passionName: e.nativeEvent.text.trim() || 'Passion' })} />
              <Field label="Daily question" defaultValue={s.passionPrompt} onEndEditing={(e) => set({ passionPrompt: e.nativeEvent.text.trim() })} />
              <Field label="Habit you're beating" defaultValue={s.quitLabel} onEndEditing={(e) => set({ quitLabel: e.nativeEvent.text.trim() || 'Stayed clean' })} />
            </View>
          )}
          {g === 'soul' && (
            <View style={{ gap: 12, marginTop: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 46 }}>
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
              <T size={13} color={colors.muted}>
                Calculation method
              </T>
              {CALC_METHODS.map((m) => {
                const on = s.calcMethod === m.id;
                return (
                  <Pressable key={m.id} onPress={() => set({ calcMethod: m.id })} accessibilityRole="radio" accessibilityState={{ selected: on }} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 40 }}>
                    <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: on ? colors.ink : colors.border, alignItems: 'center', justifyContent: 'center' }}>
                      {on ? <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.ink }} /> : null}
                    </View>
                    <T size={14}>{m.label}</T>
                  </Pressable>
                );
              })}
              <T size={13} color={colors.muted}>
                Asr time
              </T>
              <Segmented label="Asr time" value={s.madhab} onChange={(madhab) => set({ madhab })} options={[{ id: 'shafi', label: 'Standard' }, { id: 'hanafi', label: 'Hanafi (later)' }]} />
            </View>
          )}
        </Section>
      ))}

      <Section title="Reminders">
        <SwitchRow
          label="Prayer reminders"
          sub={s.location ? 'At each prayer time' : 'Set a location first'}
          value={s.prayerReminders && !!s.location}
          onChange={async (v) => {
            if (v && !(await requestPermission())) {
              Alert.alert('Notifications are off', 'Turn on notifications for Orbit in the Settings app.');
              return;
            }
            set({ prayerReminders: v });
          }}
        />
        <SwitchRow
          label="Evening check-in"
          value={s.evening.enabled}
          onChange={async (v) => {
            if (v && !(await requestPermission())) {
              Alert.alert('Notifications are off', 'Turn on notifications for Orbit in the Settings app.');
              return;
            }
            set({ evening: { ...s.evening, enabled: v } });
          }}
        />
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

      <T size={12} color={colors.muted} style={{ textAlign: 'center', marginTop: 24 }}>
        Orbit {Constants.expoConfig?.version ?? ''}
      </T>
    </Screen>
  );
}
