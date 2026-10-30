import { DayLog, Settings, habitsIn } from './habits';
import type { Group } from './theme';

export type RingStat = { done: number; total: number; frac: number };
export type DayRings = Record<Group, RingStat>;

export function ringStats(day: DayLog | undefined, s: Settings): DayRings {
  const out = {} as DayRings;
  for (const g of ['body', 'mind', 'soul'] as Group[]) {
    const hs = habitsIn(g, s);
    let done = 0;
    for (const h of hs) {
      if (h.kind === 'water') {
        done += s.waterGoal > 0 ? Math.min((day?.water ?? 0) / s.waterGoal, 1) : 0;
      } else if (day?.checks[h.id as keyof DayLog['checks']] === true) {
        done += 1;
      }
    }
    const total = hs.length;
    out[g] = { done, total, frac: total ? Math.min(done / total, 1) : 0 };
  }
  return out;
}

export function isLogged(day: DayLog | undefined): boolean {
  if (!day) return false;
  return day.water > 0 || Object.values(day.checks).some((v) => v !== undefined);
}

/** 0–3 shade level for the Progress calendar, or -1 for a day that was never logged. */
export function dayLevel(day: DayLog | undefined, s: Settings): number {
  if (!isLogged(day)) return -1;
  const r = ringStats(day, s);
  const groups = (['body', 'mind', 'soul'] as Group[]).filter((g) => r[g].total > 0);
  if (!groups.length) return 0;
  const closed = groups.filter((g) => r[g].frac >= 1).length;
  if (closed === groups.length) return 3;
  const avg = groups.reduce((a, g) => a + r[g].frac, 0) / groups.length;
  if (avg >= 0.66) return 2;
  if (avg >= 0.33) return 1;
  return 0;
}
