import { useMemo } from 'react';
import Svg, { Circle, G } from 'react-native-svg';
import type { DayRings } from '../lib/rings';
import { colors, groupColor, type Group } from '../lib/theme';

const ORDER: Group[] = ['body', 'mind', 'soul']; // outer → inner
const SEGMENTS = 72;

/** Smooth pseudo-noise in [-1, 1] so each ring gets a soft, painted variation in tone. */
function noise(i: number, seed: number) {
  return (
    0.55 * Math.sin(i * 0.21 + seed * 1.7) +
    0.3 * Math.sin(i * 0.53 + seed * 3.1) +
    0.15 * Math.sin(i * 1.37 + seed * 0.7)
  );
}

export function Rings({ stats, size = 240, stroke = 20 }: { stats: DayRings; size?: number; stroke?: number }) {
  const c = size / 2;
  const gap = Math.round(stroke * 0.22);
  const groups = ORDER.filter((g) => stats[g].total > 0);

  const rings = useMemo(
    () =>
      groups.map((g, i) => {
        const r = c - stroke / 2 - i * (stroke + gap);
        const circ = 2 * Math.PI * r;
        const frac = stats[g].frac;
        const segLen = circ / SEGMENTS;
        const shown = Math.floor(frac * SEGMENTS);
        const tex = Array.from({ length: shown }, (_, k) => {
          const n = noise(k, i + 1);
          return {
            key: k,
            color: n > 0 ? '#000000' : '#FFFFFF',
            opacity: Math.abs(n) * 0.16,
            dash: `${segLen + 0.6} ${circ}`,
            offset: -k * segLen,
          };
        });
        return { g, r, circ, frac, tex };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stats.body.frac, stats.mind.frac, stats.soul.frac, stats.body.total, stats.mind.total, stats.soul.total, size, stroke],
  );

  const label = groups
    .map((g) => `${g[0].toUpperCase()}${g.slice(1)} ${Math.round(stats[g].frac * 100)} percent`)
    .join(', ');

  return (
    <Svg width={size} height={size} accessibilityRole="image" accessibilityLabel={`Today's rings: ${label}`}>
      <G rotation={-90} origin={`${c}, ${c}`}>
        {rings.map(({ g, r, circ, frac, tex }) => (
          <G key={g}>
            <Circle cx={c} cy={c} r={r} stroke={colors.track} strokeWidth={stroke} fill="none" />
            {frac > 0 && (
              <Circle
                cx={c}
                cy={c}
                r={r}
                stroke={groupColor[g]}
                strokeWidth={stroke}
                fill="none"
                strokeLinecap={frac < 1 ? 'round' : 'butt'}
                strokeDasharray={`${circ * frac} ${circ + 4}`}
              />
            )}
            {tex.map((t) => (
              <Circle
                key={t.key}
                cx={c}
                cy={c}
                r={r}
                stroke={t.color}
                strokeOpacity={t.opacity}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={t.dash}
                strokeDashoffset={t.offset}
              />
            ))}
          </G>
        ))}
      </G>
    </Svg>
  );
}
