import { CalculationMethod, Coordinates, HighLatitudeRule, Madhab, PrayerTimes } from 'adhan';
import type { PrayerId, Settings } from './habits';

export type PrayerSchedule = Record<PrayerId, Date>;

export function prayerTimes(s: Settings, date: Date): PrayerSchedule | null {
  if (!s.location) return null;
  try {
    const coords = new Coordinates(s.location.lat, s.location.lon);
    const params = CalculationMethod[s.calcMethod]();
    params.madhab = s.madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
    params.highLatitudeRule = HighLatitudeRule.recommended(coords);
    const t = new PrayerTimes(coords, date, params);
    return { fajr: t.fajr, dhuhr: t.dhuhr, asr: t.asr, maghrib: t.maghrib, isha: t.isha };
  } catch {
    return null;
  }
}
