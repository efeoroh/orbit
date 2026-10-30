import * as Location from 'expo-location';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { deviceTimeZone } from '../lib/dates';
import type { Settings } from '../lib/habits';
import { colors } from '../lib/theme';
import { Button, Field, T } from './ui';

type Loc = NonNullable<Settings['location']>;

function labelFrom(a: Location.LocationGeocodedAddress | undefined, fallback: string) {
  if (!a) return fallback;
  return [a.city ?? a.subregion, a.region].filter(Boolean).join(', ') || fallback;
}

/** "Use my location" or type a city. The phone's time zone is shown alongside. */
export function LocationPicker({ value, onChange }: { value: Loc | null; onChange: (l: Loc) => void }) {
  const [busy, setBusy] = useState(false);
  const [city, setCity] = useState('');
  const [error, setError] = useState('');

  async function useMine() {
    setError('');
    setBusy(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        setError('Location is off for Orbit. Type your city instead.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = pos.coords;
      let label = 'Current location';
      try {
        const [a] = await Location.reverseGeocodeAsync({ latitude, longitude });
        label = labelFrom(a, label);
      } catch {}
      onChange({ lat: latitude, lon: longitude, label });
    } catch {
      setError("Couldn't get your location. Type your city instead.");
    } finally {
      setBusy(false);
    }
  }

  async function find() {
    if (!city.trim()) return;
    setError('');
    setBusy(true);
    try {
      const [hit] = await Location.geocodeAsync(city.trim());
      if (!hit) {
        setError("Couldn't find that place. Try adding the province or country.");
        return;
      }
      let label = city.trim();
      try {
        const [a] = await Location.reverseGeocodeAsync({ latitude: hit.latitude, longitude: hit.longitude });
        label = labelFrom(a, label);
      } catch {}
      onChange({ lat: hit.latitude, lon: hit.longitude, label });
      setCity('');
    } catch {
      setError("Couldn't look that up. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: 14 }}>
      {value ? (
        <View style={{ gap: 2 }}>
          <T w="semibold" size={17}>
            {value.label}
          </T>
          <T size={13} color={colors.muted}>
            Time zone: {deviceTimeZone()}
          </T>
        </View>
      ) : null}
      <Button label={value ? 'Update to my location' : 'Use my location'} onPress={useMine} disabled={busy} />
      <T size={13} color={colors.muted} style={{ textAlign: 'center' }}>
        or
      </T>
      <Field
        label="Type a city"
        placeholder="e.g. Edmonton, AB"
        value={city}
        onChangeText={setCity}
        onSubmitEditing={find}
        returnKeyType="search"
        autoCapitalize="words"
      />
      <Button label="Find city" kind="outline" onPress={find} disabled={busy || !city.trim()} />
      {busy ? <ActivityIndicator color={colors.ink} /> : null}
      {error ? (
        <T size={13} color={colors.ink2} accessibilityLiveRegion="polite">
          {error}
        </T>
      ) : null}
    </View>
  );
}
