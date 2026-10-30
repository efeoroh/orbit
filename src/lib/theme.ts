export const colors = {
  bg: '#F6F3EE',
  surface: '#FFFFFF',
  card: 'rgba(255,255,255,0.55)',
  ink: '#2F302F',
  ink2: '#4A4742',
  muted: '#6E6A64',
  line: '#E4E0D8',
  segment: '#E9E5DD',
  border: '#BDB6AA',
  dotOff: '#DDD8CF',
  dark: '#2F302F',
  onDark: '#F6F3EE',
  track: '#E7E3DB',
  body: '#8B9B82',
  mind: '#7086AB',
  soul: '#B39BC5',
} as const;

export const fonts = {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_600SemiBold',
  semibold: 'Nunito_700Bold',
  bold: 'Nunito_700Bold',
  display: 'Fredoka_600SemiBold',
  displayMedium: 'Fredoka_500Medium',
} as const;

export type Group = 'body' | 'mind' | 'soul';

export const groupColor: Record<Group, string> = {
  body: colors.body,
  mind: colors.mind,
  soul: colors.soul,
};

/** A lighter tint of each ring color, for "partly done". */
export const groupLight: Record<Group, string> = {
  body: '#C9D3C3',
  mind: '#C2CEE0',
  soul: '#DDD0E6',
};

/** A darker shade of each ring color, readable as text. */
export const groupInk: Record<Group, string> = {
  body: '#5C6B55',
  mind: '#4D6489',
  soul: '#7F659A',
};

export const groupName: Record<Group, string> = {
  body: 'Body',
  mind: 'Mind',
  soul: 'Soul',
};
