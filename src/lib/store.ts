import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { CheckId, DayLog, PrayerId, Settings, defaultSettings, emptyDay } from './habits';

const SETTINGS_KEY = 'orbit:settings:v1';
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
    const saved = s ? (JSON.parse(s) as Partial<Settings>) : {};
    state = {
      loaded: true,
      settings: {
        ...defaultSettings,
        ...saved,
        enabled: { ...defaultSettings.enabled, ...(saved.enabled ?? {}) },
        evening: { ...defaultSettings.evening, ...(saved.evening ?? {}) },
      },
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
export function setCheck(key: string, id: CheckId | PrayerId, value: boolean | undefined) {
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
