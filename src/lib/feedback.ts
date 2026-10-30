import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import type { Group } from './theme';

const SOURCES: Record<Group, number> = {
  body: require('../../assets/sounds/body.wav'),
  mind: require('../../assets/sounds/mind.wav'),
  soul: require('../../assets/sounds/soul.wav'),
};

let players: Partial<Record<Group, AudioPlayer>> = {};
let ready = false;

/** Loads the chimes once. They mix with other audio and respect the silent switch. */
export function initFeedback() {
  if (ready) return;
  ready = true;
  setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
  try {
    players = {
      body: createAudioPlayer(SOURCES.body),
      mind: createAudioPlayer(SOURCES.mind),
      soul: createAudioPlayer(SOURCES.soul),
    };
    Object.values(players).forEach((p) => p && (p.volume = 0.7));
  } catch {
    players = {};
  }
}

/** Chime + success haptic for completing something in a ring. */
export function celebrate(group: Group) {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  const p = players[group];
  if (!p) return;
  try {
    p.seekTo(0).catch(() => {});
    p.play();
  } catch {}
}

export function tick(strength: 'light' | 'medium' | 'heavy' = 'light') {
  const style =
    strength === 'heavy'
      ? Haptics.ImpactFeedbackStyle.Heavy
      : strength === 'medium'
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light;
  Haptics.impactAsync(style).catch(() => {});
}
