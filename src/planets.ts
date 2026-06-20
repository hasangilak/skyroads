// Each planet is a stage with its own gravity (which reshapes jump arcs), a
// matched jump impulse so gaps stay clearable, a track length, and a colour
// theme for the sky and the normal road tiles. Hazard-tile colours
// (lava/boost/fuel/ice) stay constant across planets so they read consistently.

export interface PlanetTheme {
  bg: string; // sky / fog colour
  roadA: string; // normal tile, shade A
  roadB: string; // normal tile, shade B
}

export interface Planet {
  name: string;
  gravity: number; // overrides the base GRAVITY
  jumpV: number; // overrides the base JUMP_V
  lengthRows: number; // track length
  theme: PlanetTheme;
}

export const PLANETS: Planet[] = [
  {
    name: 'AURORA',
    gravity: 26,
    jumpV: 8.2,
    lengthRows: 420,
    theme: { bg: '#05060f', roadA: '#3b4b90', roadB: '#2b3870' },
  },
  {
    name: 'KRYLON',
    gravity: 16, // low gravity — long, floaty jumps
    jumpV: 7.0,
    lengthRows: 460,
    theme: { bg: '#0a0413', roadA: '#6a3b8c', roadB: '#48276e' },
  },
  {
    name: 'FERROS',
    gravity: 36, // heavy gravity — short, snappy jumps, tight timing
    jumpV: 9.6,
    lengthRows: 500,
    theme: { bg: '#0f0805', roadA: '#9c5f37', roadB: '#6f3f24' },
  },
  {
    name: 'NYX',
    gravity: 28,
    jumpV: 8.6,
    lengthRows: 540,
    theme: { bg: '#02060a', roadA: '#2b7390', roadB: '#1d5066' },
  },
  {
    name: 'VORTEX',
    gravity: 32,
    jumpV: 9.2,
    lengthRows: 600,
    theme: { bg: '#0b0510', roadA: '#9c3b62', roadB: '#6e2a44' },
  },
];

// Coarse gravity label for the menu.
export function gravityLabel(g: number): string {
  if (g < 20) return 'LOW GRAVITY';
  if (g > 30) return 'HIGH GRAVITY';
  return 'NORMAL GRAVITY';
}
