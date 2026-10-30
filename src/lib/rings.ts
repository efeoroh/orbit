import { DayLog, Settings, habitsIn } from './habits';
import type { Group } from './theme';

export type RingStat = { done: number; total: number; frac: number };
export type DayRings = Record<Group, RingStat>;
export const GROUPS: Group[] = ['body', 'mind', 'soul'];

export function ringStats(day: DayLog | undefined, s: Settings): DayRings {
  const out = {} as DayRings;
  for (const g of GROUPS) {
    const hs = habitsIn(g, s);
    let done = 0;
    for (const h of hs) {
      if (h.kind === 'water') done += s.waterGoal > 0 ? Math.min((day?.water ?? 0) / s.waterGoal, 1) : 0;
      else if (day?.checks[h.id] === true) done += 1;
    }
    const total = hs.length;
    out[g] = { done, total, frac: total ? Math.min(done / total, 1) : 0 };
  }
  return out;
}

export function isLogged(day: DayLog | undefined): boolean {
  if (!day) return false;
  return day.water > 0 || Object.keys(day.checks).length > 0;
}

/** How many rings were closed that day (0–3), or -1 if the day was never logged. */
export function ringsClosed(day: DayLog | undefined, s: Settings): number {
  if (!isLogged(day)) return -1;
  const r = ringStats(day, s);
  return GROUPS.filter((g) => r[g].total > 0 && r[g].frac >= 1).length;
}
