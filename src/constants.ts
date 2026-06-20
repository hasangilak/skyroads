// Core tuning constants for the Skyroads prototype.
// Units are "tiles": one road block is 1 unit wide (x) and 1 unit deep (z).

export const LANES = 5; // road width in tiles
export const HALF = (LANES - 1) / 2; // center offset, so lanes sit at x = -2..2

// Tile geometry
export const TILE = 1; // grid spacing
export const TILE_GAP = 0.08; // visual seam between tiles
export const TILE_THICKNESS = 0.4; // block height; top surface sits at y = 0

// Craft motion
export const BASE_SPEED = 9; // cruising speed (units/sec)
export const MIN_SPEED = 5; // while braking
export const MAX_SPEED = 17; // while boosting
export const ACCEL = 14; // how fast speed eases toward its target
export const STRAFE_SPEED = 7; // lateral speed (units/sec)
export const JUMP_V = 8.2; // initial upward velocity of a jump
export const GRAVITY = 26; // downward acceleration

// The craft hovers slightly above the road; y is measured from the road top.
export const PLAYER_Y = 0.3;

// Rendering window: how many rows of road we draw around the craft.
export const VISIBLE_AHEAD = 70;
export const VISIBLE_BEHIND = 6;
export const MAX_TILES = LANES * (VISIBLE_AHEAD + VISIBLE_BEHIND);

// Chase camera placement
export const CAMERA_BACK = 6.5;
export const CAMERA_HEIGHT = 3.2;
export const CAMERA_LOOK_AHEAD = 9;

export const COLORS = {
  bg: '#05060f',
  roadA: '#3b4b90',
  roadB: '#2b3870',
  player: '#ff6b35',
  cockpit: '#ffd23f',
} as const;

export const clamp = (v: number, lo: number, hi: number): number =>
  v < lo ? lo : v > hi ? hi : v;

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
