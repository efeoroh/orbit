import * as Notifications from 'expo-notifications';
import { addDays, dateKey, formatTime } from './dates';
import { PRAYERS, PRAYER_NAMES, PrayerId, Settings } from './habits';
import { prayerTimes } from './prayer';

export const PRAYER_CATEGORY = 'prayer';
export const PRAYED_ACTION = 'prayed';
const DAYS_AHEAD = 9; // 9 days × 5 prayers + 1 daily = 46, under iOS's 64 pending limit

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function setupCategories() {
  try {
    await Notifications.setNotificationCategoryAsync(PRAYER_CATEGORY, [
      { identifier: PRAYED_ACTION, buttonTitle: 'Mark as prayed', options: { opensAppToForeground: true } },
    ]);
  } catch {
    // categories are a nice-to-have
  }
}

export async function hasPermission(): Promise<boolean> {
  const p = await Notifications.getPermissionsAsync();
  return p.granted;
}

export async function requestPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const p = await Notifications.requestPermissionsAsync();
  return p.granted;
}

let running: Promise<void> | null = null;

/** Rebuilds every scheduled reminder from the current settings. Safe to call often. */
export function rescheduleAll(s: Settings): Promise<void> {
  const run = async () => {
    if (!s.onboarded) return;
    if (!(await hasPermission())) return;
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (s.prayerReminders && s.location) {
      const now = Date.now();
      for (let i = 0; i < DAYS_AHEAD; i++) {
        const day = addDays(new Date(), i);
        const times = prayerTimes(s, day);
        if (!times) break;
        for (const p of PRAYERS) {
          if (s.enabled[p] === false) continue;
          const at = times[p];
          if (at.getTime() <= now + 30_000) continue;
          await Notifications.scheduleNotificationAsync({
            content: {
              title: PRAYER_NAMES[p],
              body: `It's time for ${PRAYER_NAMES[p]} · ${formatTime(at)}`,
              data: { type: 'prayer', prayer: p, date: dateKey(day) },
              categoryIdentifier: PRAYER_CATEGORY,
            },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
          });
        }
      }
    }

    if (s.evening.enabled) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Evening check-in',
          body: s.name ? `${s.name}, close out today's rings.` : "Close out today's rings.",
          data: { type: 'evening' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: s.evening.hour,
          minute: s.evening.minute,
        },
      });
    }
  };
  const next = (running ?? Promise.resolve()).then(run, run).catch(() => {});
  running = next;
  return next;
}

export type ReminderData = { type: 'prayer'; prayer: PrayerId; date: string } | { type: 'evening' };
