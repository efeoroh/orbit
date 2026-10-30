export const colors = {
  bg: '#F4F2ED',
  surface: '#FBFAF7',
  ink: '#1F1F1F',
  ink2: '#4A4742',
  muted: '#6E6A64',
  line: '#E4E0D8',
  segment: '#E7E3DB',
  border: '#BDB6AA',
  dotOff: '#DCD7CE',
  dark: '#2B2A28',
  onDark: '#F4F2ED',
  track: '#E7E3DB',
  body: '#8FA68E',
  mind: '#6F86A3',
  soul: '#A190BC',
} as const;

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export type Group = 'body' | 'mind' | 'soul';

export const groupColor: Record<Group, string> = {
  body: colors.body,
  mind: colors.mind,
  soul: colors.soul,
};

export const groupName: Record<Group, string> = {
  body: 'Body',
  mind: 'Mind',
  soul: 'Soul',
};
