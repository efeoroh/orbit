import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { todayKey } from './dates';

/** Today's date key, refreshed when the screen is focused, the app returns, or midnight passes. */
export function useToday(): string {
  const [key, setKey] = useState(todayKey);
  const refresh = useCallback(() => setKey(todayKey()), []);
  useFocusEffect(refresh);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    const t = setInterval(refresh, 60_000);
    return () => {
      sub.remove();
      clearInterval(t);
    };
  }, [refresh]);
  return key;
}
