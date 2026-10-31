/** Choices offered in onboarding and Customize. Everything also has an "Other" you can type. */

export const PASSIONS = [
  'Music',
  'Art',
  'Writing',
  'Coding',
  'Reading',
  'Photography',
  'Language learning',
  'Business / side project',
  'Content creation',
] as const;

const GENERIC_QUESTIONS = [
  'Did you work on it today?',
  'Did you practice for 30+ minutes?',
  'Did you learn something new?',
  'Did you make real progress?',
  'Did you finish or share something?',
];

export const PASSION_QUESTIONS: Record<string, string[]> = {
  Music: [
    'Did you make a track today?',
    'Did you practice your instrument?',
    'Did you write lyrics or melodies?',
    'Did you work on music for 30+ minutes?',
    'Did you finish or share something?',
  ],
  Art: [
    'Did you draw or paint today?',
    'Did you sketch for 20+ minutes?',
    'Did you study a technique or reference?',
    'Did you work on a piece?',
    'Did you finish or share something?',
  ],
  Writing: [
    'Did you write today?',
    'Did you write 500+ words?',
    'Did you journal?',
    'Did you edit or revise something?',
    'Did you finish or share a piece?',
  ],
  Coding: [
    'Did you code today?',
    'Did you work on your project?',
    'Did you learn something new?',
    'Did you ship a feature or fix?',
    'Did you code for an hour?',
  ],
  Reading: [
    'Did you read today?',
    'Did you read 20+ pages?',
    'Did you read for 30 minutes?',
    'Did you take notes?',
    'Did you finish a chapter?',
  ],
  Photography: [
    'Did you shoot today?',
    'Did you edit photos?',
    'Did you practice a technique?',
    'Did you go out shooting for 30+ minutes?',
    'Did you share a photo?',
  ],
  'Language learning': [
    'Did you practice today?',
    'Did you do your lesson?',
    'Did you learn new words?',
    'Did you speak or listen for 15+ minutes?',
    'Did you review flashcards?',
  ],
  'Business / side project': [
    'Did you work on it today?',
    'Did you do one thing that moves it forward?',
    'Did you reach out to someone?',
    'Did you work on it for an hour?',
    'Did you ship something?',
  ],
  'Content creation': [
    'Did you create today?',
    'Did you film or record?',
    'Did you edit something?',
    'Did you post something?',
    'Did you plan your next piece?',
  ],
};

export function questionsFor(passion: string): string[] {
  return PASSION_QUESTIONS[passion] ?? GENERIC_QUESTIONS;
}

export const QUIT_HABITS = ['No PMO', 'No doom-scrolling', 'No smoking / vaping', 'No alcohol', 'No gaming binge'] as const;

export const MEDS = [
  'Multivitamin',
  'Vitamin D',
  'Omega-3 (fish oil)',
  'Magnesium',
  'Creatine',
  'Vitamin B12',
  'Iron',
  'Zinc',
  'Probiotic',
] as const;

export type Unit = 'reps' | 'sec' | 'min' | 'steps' | 'km';

export const UNITS: { id: Unit; label: string }[] = [
  { id: 'reps', label: 'Reps' },
  { id: 'sec', label: 'Seconds' },
  { id: 'min', label: 'Minutes' },
  { id: 'steps', label: 'Steps' },
  { id: 'km', label: 'Km' },
];

export type WorkoutPreset = { name: string; unit: Unit; target: number; step: number };

export const WORKOUTS: WorkoutPreset[] = [
  { name: 'Push-ups', unit: 'reps', target: 20, step: 2 },
  { name: 'Plank', unit: 'sec', target: 60, step: 10 },
  { name: 'Squats', unit: 'reps', target: 30, step: 5 },
  { name: 'Sit-ups', unit: 'reps', target: 20, step: 2 },
  { name: 'Pull-ups', unit: 'reps', target: 5, step: 1 },
  { name: 'Run', unit: 'min', target: 20, step: 5 },
  { name: 'Walk', unit: 'steps', target: 8000, step: 500 },
  { name: 'Gym session', unit: 'min', target: 45, step: 5 },
  { name: 'Stretching / yoga', unit: 'min', target: 10, step: 5 },
];

export function presetFor(name: string): WorkoutPreset {
  return WORKOUTS.find((w) => w.name.toLowerCase() === name.trim().toLowerCase()) ?? { name, unit: 'reps', target: 10, step: 1 };
}

/** Sensible step size for a target in a unit. */
export function stepFor(unit: Unit): number {
  return { reps: 1, sec: 5, min: 5, steps: 500, km: 0.5 }[unit];
}

export const WATER_GOALS = [2, 2.5, 3, 3.5, 4] as const;
export const SALT_LIMITS = ['⅛ tsp', '¼ tsp', '½ tsp', '1 tsp'] as const;
