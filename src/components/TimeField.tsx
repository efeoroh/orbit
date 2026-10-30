import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { formatHourMinute } from '../lib/dates';
import { colors } from '../lib/theme';
import { T } from './ui';

/** A tappable time value that opens an inline iOS time wheel. */
export function TimeField({
  hour,
  minute,
  onChange,
  label,
}: {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const value = new Date();
  value.setHours(hour, minute, 0, 0);
  return (
    <View>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${formatHourMinute(hour, minute)}`}
        accessibilityHint="Opens a time picker"
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 48 }}
      >
        <T size={15}>{label}</T>
        <T size={15} color={colors.ink2}>
          {formatHourMinute(hour, minute)}
        </T>
      </Pressable>
      {open && (
        <DateTimePicker
          value={value}
          mode="time"
          display="spinner"
          minuteInterval={5}
          onChange={(_e, d) => {
            if (d) onChange(d.getHours(), d.getMinutes());
          }}
        />
      )}
    </View>
  );
}
