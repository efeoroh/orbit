import type { Group } from './theme';

export type PrayerId = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export type CheckId = 'sodium' | 'sugar' | 'pushups' | 'meds' | 'skin' | 'passion' | 'clean';
export type HabitId = CheckId | PrayerId | 'water';

export type CalcMethod =
  | 'NorthAmerica'
  | 'MuslimWorldLeague'
  | 'UmmAlQura'
  | 'Egyptian'
  | 'Karachi'
  | 'MoonsightingCommittee';

export const CALC_METHODS: { id: CalcMethod; label: string }[] = [
  { id: 'NorthAmerica', label: 'North America (ISNA)' },
  { id: 'MuslimWorldLeague', label: 'Muslim World League' },
  { id: 'MoonsightingCommittee', label: 'Moonsighting Committee' },
  { id: 'UmmAlQura', label: 'Umm al-Qura (Makkah)' },
  { id: 'Egyptian', label: 'Egyptian General Authority' },
  { id: 'Karachi', label: 'University of Karachi' },
];

export type Settings = {
  version: 1;
  onboarded: boolean;
  name: string;
  location: { lat: number; lon: number; label: string } | null;
  calcMethod: CalcMethod;
  madhab: 'shafi' | 'hanafi';
  passionName: string;
  passionPrompt: string;
  quitLabel: string;
  medsLabel: string;
  saltLimit: string;
  waterGoal: number;
  waterStep: number;
  pushups: number;
  plankSec: number;
  enabled: Record<HabitId, boolean>;
  prayerReminders: boolean;
  evening: { enabled: boolean; hour: number; minute: number };
};

export type DayLog = {
  checks: Partial<Record<CheckId | PrayerId, boolean>>;
  water: number;
  updatedAt: number;
};

export const ALL_IDS: HabitId[] = [
  'sodium', 'sugar', 'pushups', 'meds', 'skin', 'water',
  'passion', 'clean',
  'fajr', 'dhuhr', 'asr', 'maghrib', 'isha',
];

export const defaultSettings: Settings = {
  version: 1,
  onboarded: false,
  name: '',
  location: null,
  calcMethod: 'NorthAmerica',
  madhab: 'shafi',
  passionName: 'Music',
  passionPrompt: 'Did you make a track today?',
  quitLabel: 'No PMO',
  medsLabel: 'Vitamins / Medication',
  saltLimit: '¼ tsp',
  waterGoal: 3,
  waterStep: 0.5,
  pushups: 20,
  plankSec: 60,
  enabled: Object.fromEntries(ALL_IDS.map((id) => [id, true])) as Record<HabitId, boolean>,
  prayerReminders: true,
  evening: { enabled: true, hour: 21, minute: 30 },
};

export function emptyDay(): DayLog {
  return { checks: {}, water: 0, updatedAt: 0 };
}

export type HabitDef = {
  id: HabitId;
  group: Group;
  kind: 'check' | 'water' | 'prayer';
  /** Confirmed toward the end of the day. */
  endOfDay?: boolean;
  label: (s: Settings) => string;
  sub: (s: Settings) => string;
};

export const PRAYER_NAMES: Record<PrayerId, string> = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

export const PRAYERS: PrayerId[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export const HABITS: HabitDef[] = [
  // Body
  { id: 'meds', group: 'body', kind: 'check', label: (s) => s.medsLabel || 'Vitamins / Medication', sub: () => 'Took them today' },
  { id: 'skin', group: 'body', kind: 'check', label: () => 'Skincare', sub: () => 'Did your routine' },
  { id: 'pushups', group: 'body', kind: 'check', label: () => 'Push-ups + plank', sub: (s) => `${s.pushups} push-ups · ${s.plankSec} sec plank` },
  { id: 'sodium', group: 'body', kind: 'check', endOfDay: true, label: () => 'Low sodium', sub: (s) => `${s.saltLimit} salt per dish, all day` },
  { id: 'sugar', group: 'body', kind: 'check', endOfDay: true, label: () => 'No sugar', sub: () => 'Zero added sugar today' },
  { id: 'water', group: 'body', kind: 'water', label: () => 'Water', sub: (s) => `${fmtNum(s.waterGoal)} L goal` },
  // Mind
  { id: 'passion', group: 'mind', kind: 'check', label: (s) => s.passionName || 'Passion', sub: (s) => s.passionPrompt || 'Did you do it today?' },
  { id: 'clean', group: 'mind', kind: 'check', endOfDay: true, label: (s) => s.quitLabel || 'Stayed clean', sub: () => 'Stayed clean today' },
  // Soul
  ...PRAYERS.map<HabitDef>((p) => ({ id: p, group: 'soul', kind: 'prayer', label: () => PRAYER_NAMES[p], sub: () => '' })),
];

export function habitsIn(group: Group, s: Settings): HabitDef[] {
  return HABITS.filter((h) => h.group === group && s.enabled[h.id] !== false);
}

/** The yes/no habits the step-by-step check-in walks through, end-of-day ones last. */
export function checkInSteps(s: Settings): HabitDef[] {
  const checks = HABITS.filter((h) => h.kind === 'check' && s.enabled[h.id] !== false);
  return [...checks.filter((h) => !h.endOfDay), ...checks.filter((h) => h.endOfDay)];
}

export function fmtNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
