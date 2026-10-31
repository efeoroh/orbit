import { View } from 'react-native';
import { UNITS, WORKOUTS, stepFor } from '../lib/catalog';
import { LEVEL_UP_DAYS, Workout, workoutTarget } from '../lib/habits';
import { colors } from '../lib/theme';
import { Stepper } from './pickers';
import { Segmented, T } from './ui';

/** Target + "push for more" for one workout. */
export function WorkoutSetup({ w, onChange, compact }: { w: Workout; onChange: (w: Workout) => void; compact?: boolean }) {
  const custom = !WORKOUTS.some((p) => p.name === w.name);
  const unitStep = stepFor(w.unit);

  return (
    <View style={{ gap: compact ? 14 : 22 }}>
      {custom ? (
        <View style={{ gap: 8 }}>
          <T w="semibold" size={13} color={colors.muted}>
            Measured in
          </T>
          <Segmented
            label="Unit"
            value={w.unit}
            onChange={(unit) => onChange({ ...w, unit, step: stepFor(unit) })}
            options={UNITS.filter((u) => u.id !== 'km').map((u) => ({ id: u.id, label: u.label }))}
          />
        </View>
      ) : null}

      <View style={{ gap: 10 }}>
        <T w="semibold" size={13} color={colors.muted}>
          Daily target
        </T>
        <Stepper value={w.target} step={unitStep} min={unitStep} onChange={(target) => onChange({ ...w, target })} format={(n) => workoutTarget({ target: n, unit: w.unit })} />
      </View>

      <View style={{ gap: 10 }}>
        <T w={compact ? 'semibold' : 'display'} size={compact ? 13 : 20} color={compact ? colors.muted : colors.ink}>
          Push for more once you hit it?
        </T>
        <Segmented
          label="Push for more"
          value={w.levelUp ? 'yes' : 'no'}
          onChange={(v) => onChange({ ...w, levelUp: v === 'yes' })}
          options={[
            { id: 'yes', label: 'Yes, level me up' },
            { id: 'no', label: 'Keep it steady' },
          ]}
        />
        {w.levelUp ? (
          <View style={{ gap: 10, marginTop: 4 }}>
            <T size={14} color={colors.ink2}>
              Every {LEVEL_UP_DAYS} days in a row you hit it, your target goes up by:
            </T>
            <Stepper value={w.step} step={unitStep} min={unitStep} onChange={(step) => onChange({ ...w, step })} format={(n) => `+${workoutTarget({ target: n, unit: w.unit })}`} />
          </View>
        ) : null}
      </View>
    </View>
  );
}
