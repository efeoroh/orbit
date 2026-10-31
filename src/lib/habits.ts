import { Unit, presetFor } from './catalog';
import type { Group } from './theme';

export type PrayerId = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
/** Fixed habits that can be switched on or off. Medications and workouts are user-made lists. */
export type FixedId = 'sodium' | 'sugar' | 'skin' | 'water' | 'passion' | 'clean' | PrayerId;

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

export type ListItem = { id: string; name: string; detail?: string };

export type Workout = ListItem & {
  target: number;
  unit: Unit;
  /** Raise the target after each 7-day streak. */
  levelUp: boolean;
  step: number;
  /** Day key of the last automatic raise, so it only happens once a day. */
  lastLevelUp?: string;
};

export const LEVEL_UP_DAYS = 7;

export type Settings = {
  version: 2;
  onboarded: boolean;
  name: string;
  location: { lat: number; lon: number; label: string } | null;
  calcMethod: CalcMethod;
  madhab: 'shafi' | 'hanafi';
  passionName: string;
  passionPrompt: string;
  quitLabel: string;
  meds: ListItem[];
  workouts: Workout[];
  saltLimit: string;
  waterGoal: number;
  /** Size of one glass, in litres. */
  glass: number;
  enabled: Record<FixedId, boolean>;
  prayerReminders: boolean;
  evening: { enabled: boolean; hour: number; minute: number };
  sounds: boolean;
};

export type DayLog = {
  /** Keyed by habit id: fixed ids, prayer ids, `med:<id>` or `wo:<id>`. */
  checks: Record<string, boolean>;
  water: number;
  updatedAt: number;
};

export const PRAYERS: PrayerId[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
export const PRAYER_NAMES: Record<PrayerId, string> = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

const FIXED: FixedId[] = ['sodium', 'sugar', 'skin', 'water', 'passion', 'clean', ...PRAYERS];

export const MAX_WORKOUTS = 3;

export function newId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export const defaultSettings: Settings = {
  version: 2,
  onboarded: false,
  name: '',
  location: null,
  calcMethod: 'NorthAmerica',
  madhab: 'shafi',
  passionName: '',
  passionPrompt: '',
  quitLabel: '',
  meds: [],
  workouts: [],
  saltLimit: '¼ tsp',
  waterGoal: 3,
  glass: 0.5,
  enabled: Object.fromEntries(FIXED.map((id) => [id, true])) as Record<FixedId, boolean>,
  prayerReminders: true,
  evening: { enabled: true, hour: 21, minute: 30 },
  sounds: true,
};

export function emptyDay(): DayLog {
  return { checks: {}, water: 0, updatedAt: 0 };
}

/** Brings older saved settings up to the current shape. */
export function migrateSettings(saved: Record<string, any>): Settings {
  const s: Settings = {
    ...defaultSettings,
    ...saved,
    version: 2,
    enabled: { ...defaultSettings.enabled, ...(saved.enabled ?? {}) },
    evening: { ...defaultSettings.evening, ...(saved.evening ?? {}) },
  } as Settings;
  if (!Array.isArray(saved.meds)) {
    const label = String(saved.medsLabel ?? '').trim();
    s.meds =
      !label || label === 'Vitamins / Medication'
        ? []
        : label
            .split(/\s*(?:\+|,|&|\band\b)\s*/i)
            .map((n) => n.trim())
            .filter(Boolean)
            .map((n) => ({ id: newId(), name: n[0].toUpperCase() + n.slice(1) }));
  }
  if (!Array.isArray(saved.workouts)) {
    s.workouts = [
      makeWorkout('Push-ups', { target: Number(saved.pushups) || 20, id: 'pushups' }),
      makeWorkout('Plank', { target: Number(saved.plankSec) || 60, id: 'plank' }),
    ];
  } else {
    s.workouts = saved.workouts.map((w: any) => (typeof w.target === 'number' ? w : fromOldWorkout(w)));
  }
  // Settings from before passion/quit became choices kept their old defaults.
  if (saved.passionName === undefined) s.passionName = 'Music';
  if (saved.passionPrompt === undefined) s.passionPrompt = 'Did you make a track today?';
  if (saved.quitLabel === undefined) s.quitLabel = 'No PMO';
  if (typeof saved.glass !== 'number') s.glass = typeof saved.waterStep === 'number' ? saved.waterStep : 0.5;
  for (const k of ['medsLabel', 'pushups', 'plankSec', 'waterStep']) delete (s as any)[k];
  return s;
}

export function makeWorkout(name: string, over: Partial<Workout> = {}): Workout {
  const p = presetFor(name);
  return { id: newId(), name, target: p.target, unit: p.unit, step: p.step, levelUp: true, ...over };
}

/** Old workouts stored "20 reps" / "60 seconds" as text. */
function fromOldWorkout(w: { id: string; name: string; detail?: string }): Workout {
  const m = String(w.detail ?? '').match(/([\d.]+)\s*(rep|sec|second|min|minute|step|km)?/i);
  const p = presetFor(w.name);
  const unitWord = (m?.[2] ?? '').toLowerCase();
  const unit: Unit = unitWord.startsWith('rep') ? 'reps' : unitWord.startsWith('sec') ? 'sec' : unitWord.startsWith('min') ? 'min' : unitWord.startsWith('step') ? 'steps' : unitWord === 'km' ? 'km' : p.unit;
  return { id: w.id, name: w.name, target: m ? Number(m[1]) : p.target, unit, step: p.step, levelUp: false };
}

const UNIT_WORD: Record<Unit, [string, string]> = {
  reps: ['rep', 'reps'],
  sec: ['second', 'seconds'],
  min: ['minute', 'minutes'],
  steps: ['step', 'steps'],
  km: ['km', 'km'],
};

export function workoutTarget(w: Pick<Workout, 'target' | 'unit'>): string {
  const n = w.target;
  const [one, many] = UNIT_WORD[w.unit] ?? ['', ''];
  const num = n >= 1000 ? n.toLocaleString('en-US') : fmtNum(n);
  return `${num} ${n === 1 ? one : many}`;
}

export type HabitDef = {
  id: string;
  group: Group;
  kind: 'check' | 'water' | 'prayer';
  /** Confirmed toward the end of the day. */
  endOfDay?: boolean;
  name: string;
  sub: string;
  /** The question asked in the check-in. */
  prompt: string;
};

export function fmtNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function glasses(s: Settings): number {
  return Math.max(1, Math.round(s.waterGoal / (s.glass || 0.5)));
}

/** Every habit currently being tracked, in ring order. */
export function allHabits(s: Settings): HabitDef[] {
  const on = (id: FixedId) => s.enabled[id] !== false;
  const out: HabitDef[] = [];
  // Body
  for (const m of s.meds) {
    out.push({ id: `med:${m.id}`, group: 'body', kind: 'check', name: m.name, sub: m.detail || 'Daily', prompt: m.detail || 'Took it today?' });
  }
  if (on('skin')) out.push({ id: 'skin', group: 'body', kind: 'check', name: 'Skincare', sub: 'Your routine', prompt: 'Did your routine?' });
  for (const w of s.workouts) {
    const t = workoutTarget(w);
    out.push({ id: `wo:${w.id}`, group: 'body', kind: 'check', name: w.name, sub: t, prompt: t });
  }
  if (on('sodium')) out.push({ id: 'sodium', group: 'body', kind: 'check', endOfDay: true, name: 'Low sodium', sub: `${s.saltLimit} salt per dish`, prompt: `${s.saltLimit} salt per dish, all day` });
  if (on('sugar')) out.push({ id: 'sugar', group: 'body', kind: 'check', endOfDay: true, name: 'No sugar', sub: 'Zero added sugar', prompt: 'Zero added sugar today' });
  if (on('water')) out.push({ id: 'water', group: 'body', kind: 'water', endOfDay: true, name: 'Water', sub: `${fmtNum(s.waterGoal)} L`, prompt: `Drank your ${fmtNum(s.waterGoal)} L today?` });
  // Mind
  if (on('passion') && s.passionName) out.push({ id: 'passion', group: 'mind', kind: 'check', name: s.passionName, sub: s.passionPrompt, prompt: s.passionPrompt || 'Did you work on it today?' });
  if (on('clean') && s.quitLabel) out.push({ id: 'clean', group: 'mind', kind: 'check', endOfDay: true, name: s.quitLabel || 'Stayed clean', sub: 'Stayed clean', prompt: 'Stayed clean today' });
  // Soul
  for (const p of PRAYERS) if (on(p)) out.push({ id: p, group: 'soul', kind: 'prayer', name: PRAYER_NAMES[p], sub: '', prompt: '' });
  return out;
}

export function habitsIn(group: Group, s: Settings): HabitDef[] {
  return allHabits(s).filter((h) => h.group === group);
}

/** The one-at-a-time check-in: everything except prayers, end-of-day items last. */
export function checkInSteps(s: Settings): HabitDef[] {
  const hs = allHabits(s).filter((h) => h.kind !== 'prayer');
  const order = (h: HabitDef) => (h.endOfDay ? 1 : 0);
  const early = hs.filter((h) => order(h) === 0);
  const late = hs.filter((h) => order(h) === 1 && h.group === 'body');
  const lateMind = hs.filter((h) => order(h) === 1 && h.group === 'mind');
  return [...early, ...late, ...lateMind];
}

/** Whether a habit counts as done on a day. */
export function isDone(h: HabitDef, day: DayLog | undefined, s: Settings): boolean {
  if (!day) return false;
  if (h.kind === 'water') return day.water >= s.waterGoal;
  return day.checks[h.id] === true;
}
