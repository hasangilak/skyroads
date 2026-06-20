// Each planet is a stage with its own gravity, a matched jump impulse, a track
// length, a difficulty (drives the generator) and a colour theme.
//
// Gravity is deliberately kept in a modest band (23–31). Each planet's jumpV is
// tuned to `sqrt(2 * gravity * 1.4)` so the jump *apex height* is constant
// across planets — gravity only changes the airtime/snappiness of a jump, never
// whether a gap is clearable. Low-gravity planets float a touch longer;
// high-gravity ones are a touch snappier. Hazard-tile colours stay constant so
// they read consistently everywhere.

export interface PlanetTheme {
  bg: string; // sky / fog colour
  roadA: string; // normal tile, shade A
  roadB: string; // normal tile, shade B
}

export interface Planet {
  name: string;
  gravity: number; // overrides the base GRAVITY
  jumpV: number; // matched so jump apex is constant (~1.4)
  lengthRows: number; // track length
  difficulty: number; // 0 (gentle) .. 1 (dense/tight), drives the generator
  theme: PlanetTheme;
}

export const PLANETS: Planet[] = [
  {
    name: 'AURORA',
    gravity: 26,
    jumpV: 8.53,
    lengthRows: 420,
    difficulty: 0,
    theme: { bg: '#05060f', roadA: '#3b4b90', roadB: '#2b3870' },
  },
  {
    name: 'KRYLON',
    gravity: 23, // low — jumps float a little longer
    jumpV: 8.02,
    lengthRows: 460,
    difficulty: 0.25,
    theme: { bg: '#0a0413', roadA: '#6a3b8c', roadB: '#48276e' },
  },
  {
    name: 'FERROS',
    gravity: 30, // heavy — jumps are a little snappier
    jumpV: 9.17,
    lengthRows: 500,
    difficulty: 0.5,
    theme: { bg: '#0f0805', roadA: '#9c5f37', roadB: '#6f3f24' },
  },
  {
    name: 'NYX',
    gravity: 27,
    jumpV: 8.69,
    lengthRows: 540,
    difficulty: 0.75,
    theme: { bg: '#02060a', roadA: '#2b7390', roadB: '#1d5066' },
  },
  {
    name: 'VORTEX',
    gravity: 31,
    jumpV: 9.32,
    lengthRows: 600,
    difficulty: 1,
    theme: { bg: '#0b0510', roadA: '#9c3b62', roadB: '#6e2a44' },
  },
];

// Coarse gravity label for the menu (band is 23–31).
export function gravityLabel(g: number): string {
  if (g < 25) return 'LOW GRAVITY';
  if (g > 29) return 'HIGH GRAVITY';
  return 'NORMAL GRAVITY';
}
