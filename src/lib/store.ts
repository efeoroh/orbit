import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { addDays, dateKey, fromKey } from './dates';
import { DayLog, LEVEL_UP_DAYS, Settings, defaultSettings, emptyDay, migrateSettings, workoutTarget } from './habits';

const SETTINGS_KEY = 'orbit:settings:v1'; // shape is migrated on load
const DAYS_KEY = 'orbit:days:v1';

export type OrbitState = {
  loaded: boolean;
  settings: Settings;
  days: Record<string, DayLog>;
};

let state: OrbitState = { loaded: false, settings: defaultSettings, days: {} };
const listeners = new Set<() => void>();
const settingsListeners = new Set<(s: Settings) => void>();

function emit() {
  listeners.forEach((l) => l());
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    AsyncStorage.multiSet([
      [SETTINGS_KEY, JSON.stringify(state.settings)],
      [DAYS_KEY, JSON.stringify(state.days)],
    ]).catch(() => {});
  }, 250);
}

export async function loadStore(): Promise<void> {
  if (state.loaded) return;
  try {
    const [[, s], [, d]] = await AsyncStorage.multiGet([SETTINGS_KEY, DAYS_KEY]);
    state = {
      loaded: true,
      settings: s ? migrateSettings(JSON.parse(s)) : defaultSettings,
      days: d ? JSON.parse(d) : {},
    };
  } catch {
    state = { ...state, loaded: true };
  }
  emit();
}

export function getState(): OrbitState {
  return state;
}

export function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Called whenever settings change (used to reschedule reminders). */
export function onSettingsChange(l: (s: Settings) => void): () => void {
  settingsListeners.add(l);
  return () => settingsListeners.delete(l);
}

export function useOrbit(): OrbitState {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function updateSettings(patch: Partial<Settings>) {
  state = { ...state, settings: { ...state.settings, ...patch } };
  emit();
  scheduleSave();
  settingsListeners.forEach((l) => l(state.settings));
}

function updateDay(key: string, fn: (d: DayLog) => DayLog) {
  const prev = state.days[key] ?? emptyDay();
  const next = { ...fn(prev), updatedAt: Date.now() };
  state = { ...state, days: { ...state.days, [key]: next } };
  emit();
  scheduleSave();
}

/** value `undefined` clears the answer. */
export function setCheck(key: string, id: string, value: boolean | undefined) {
  updateDay(key, (d) => {
    const checks = { ...d.checks };
    if (value === undefined) delete checks[id];
    else checks[id] = value;
    return { ...d, checks };
  });
}

export function setWater(key: string, liters: number) {
  const v = Math.max(0, Math.round(liters * 100) / 100);
  updateDay(key, (d) => ({ ...d, water: v }));
}

export function exportJson(): string {
  return JSON.stringify(
    { app: 'Orbit', exportedAt: new Date().toISOString(), settings: state.settings, days: state.days },
    null,
    2,
  );
}

/**
 * After a workout is marked done: if "push for more" is on and this completes a
 * 7-day streak, raise its target once. Returns the new target text, or null.
 */
export function levelUpIfEarned(habitId: string, key: string): { name: string; target: string } | null {
  if (!habitId.startsWith('wo:')) return null;
  const id = habitId.slice(3);
  const w = state.settings.workouts.find((x) => x.id === id);
  if (!w || !w.levelUp || w.lastLevelUp === key) return null;
  let streak = 0;
  const d = fromKey(key);
  for (let i = 0; i < 400; i++) {
    const k = dateKey(addDays(d, -i));
    if (state.days[k]?.checks[habitId] === true) streak++;
    else break;
  }
  if (streak === 0 || streak % LEVEL_UP_DAYS !== 0) return null;
  const target = Math.round((w.target + w.step) * 100) / 100;
  const next = { ...w, target, lastLevelUp: key };
  updateSettings({ workouts: state.settings.workouts.map((x) => (x.id === id ? next : x)) });
  return { name: w.name, target: workoutTarget(next) };
}
