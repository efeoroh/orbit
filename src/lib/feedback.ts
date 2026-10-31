import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import type { Group } from './theme';

export type SoundName = 'tap' | 'drop' | 'body' | 'mind' | 'soul' | 'open' | 'level';

const SOURCES: Record<SoundName, number> = {
  tap: require('../../assets/sounds/tap.wav'),
  drop: require('../../assets/sounds/drop.wav'),
  body: require('../../assets/sounds/body.wav'),
  mind: require('../../assets/sounds/mind.wav'),
  soul: require('../../assets/sounds/soul.wav'),
  open: require('../../assets/sounds/open.wav'),
  level: require('../../assets/sounds/level.wav'),
};
// A few copies of the short sounds so quick repeated taps never cut each other off.
const POOL: Record<SoundName, number> = { tap: 3, drop: 3, body: 2, mind: 2, soul: 2, open: 1, level: 1 };
const VOLUME: Record<SoundName, number> = { tap: 0.5, drop: 0.7, body: 0.8, mind: 0.8, soul: 0.8, open: 0.7, level: 0.85 };

const pools: Partial<Record<SoundName, AudioPlayer[]>> = {};
const cursor: Partial<Record<SoundName, number>> = {};
let ready = false;
let enabled = true;

/** Loads every sound once. Sounds play even with the silent switch on (they can be turned off in Customize). */
export function initFeedback() {
  if (ready) return;
  ready = true;
  setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => {});
  (Object.keys(SOURCES) as SoundName[]).forEach((name) => {
    try {
      pools[name] = Array.from({ length: POOL[name] }, () => {
        const p = createAudioPlayer(SOURCES[name]);
        p.volume = VOLUME[name];
        return p;
      });
      cursor[name] = 0;
    } catch {
      pools[name] = [];
    }
  });
}

export function setSoundsEnabled(on: boolean) {
  enabled = on;
}

export function play(name: SoundName) {
  if (!enabled) return;
  const pool = pools[name];
  if (!pool || !pool.length) return;
  const i = (cursor[name] ?? 0) % pool.length;
  cursor[name] = i + 1;
  const p = pool[i];
  try {
    p.seekTo(0)
      .then(() => p.play())
      .catch(() => {
        try {
          p.play();
        } catch {}
      });
  } catch {}
}

/** Completing something in a ring: chirp + success haptic. */
export function celebrate(group: Group) {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  play(group);
}

/** Every ordinary tap: a soft tick + light haptic. */
export function tap() {
  Haptics.selectionAsync().catch(() => {});
  play('tap');
}

export function levelUp() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  play('level');
}

/** Haptic only, used while holding. */
export function tick(strength: 'light' | 'medium' | 'heavy' = 'light') {
  const style =
    strength === 'heavy'
      ? Haptics.ImpactFeedbackStyle.Heavy
      : strength === 'medium'
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light;
  Haptics.impactAsync(style).catch(() => {});
}
