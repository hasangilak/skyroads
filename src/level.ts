import { LANES } from './constants';

// A level is a grid of typed tiles. Each row has `LANES` cells.
export enum Tile {
  Gap = 0, // empty — fall through
  Normal = 1, // solid ground
  Boost = 2, // speed pad
  Ice = 3, // slippery (low steering grip)
  Lava = 4, // lethal on contact
  Fuel = 5, // refuels on pickup
}

export interface Level {
  grid: Tile[][];
  length: number;
}

const rnd = (n: number) => Math.floor(Math.random() * n);
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function makeRow(fill: Tile): Tile[] {
  return new Array<Tile>(LANES).fill(fill);
}

// Weighted pick from [key, weight] pairs.
function pick(weights: [string, number][]): string {
  let total = 0;
  for (const [, w] of weights) total += w;
  let r = Math.random() * total;
  for (const [k, w] of weights) {
    r -= w;
    if (r <= 0) return k;
  }
  return weights[weights.length - 1][0];
}

// `difficulty` (0..1) scales how dense and tight the track is: more hazards,
// fewer rests, longer ice, fewer fuel pickups. Run-ups and corridor widths keep
// safe minimums so every track stays passable.
export function generateLevel(totalRows = 480, difficulty = 0): Level {
  const grid: Tile[][] = [];
  const d = clamp01(difficulty);

  const add = (n: number, fill: Tile) => {
    for (let i = 0; i < n; i++) grid.push(makeRow(fill));
  };

  add(Math.round(14 - d * 5), Tile.Normal); // intro (shorter when harder)

  while (grid.length < totalRows - 30) {
    const seg = pick([
      ['gap', 1 + d * 1.5],
      ['lavaStrip', 1 + d * 1.4],
      ['lavaLanes', 1 + d * 1.2],
      ['narrow', 0.8 + d * 1.2],
      ['boost', 1.0],
      ['ice', 0.7 + d * 1.1],
      ['cruise', 2.4 - d * 1.7],
    ]);

    if (seg === 'gap') {
      // Run-up, a two-row hole, then a landing strip.
      add(Math.max(3, 3 + rnd(3) - Math.round(d * 2)), Tile.Normal);
      add(2, Tile.Gap);
      add(Math.max(2, 3 - Math.round(d)), Tile.Normal);
    } else if (seg === 'lavaStrip') {
      // Full-width lava you must jump.
      add(Math.max(3, 3 + rnd(2) - Math.round(d * 2)), Tile.Normal);
      add(2, Tile.Lava);
      add(Math.max(2, 3 - Math.round(d)), Tile.Normal);
    } else if (seg === 'lavaLanes') {
      // Lava lanes to strafe around — always leaves at least two safe lanes.
      add(3, Tile.Normal);
      const base = makeRow(Tile.Normal);
      let count = 1;
      if (Math.random() < 0.4 + d * 0.4) count++;
      if (d > 0.6 && Math.random() < 0.4) count++;
      const maxLava = Math.min(count, LANES - 2);
      const lanes = new Set<number>();
      while (lanes.size < maxLava) lanes.add(rnd(LANES));
      lanes.forEach((l) => (base[l] = Tile.Lava));
      const len = 4 + rnd(3) + Math.round(d * 2);
      for (let i = 0; i < len; i++) grid.push([...base]);
    } else if (seg === 'narrow') {
      // Narrowing corridor. Keep the run-up generous so it stays reachable.
      const width = Math.max(2, 3 - Math.round(d)); // 3 gentle, 2 hard
      const lo = rnd(LANES - width + 1);
      add(4, Tile.Normal);
      const len = 4 + rnd(4) + Math.round(d * 3);
      for (let i = 0; i < len; i++) {
        const row = makeRow(Tile.Gap);
        for (let l = lo; l < lo + width; l++) row[l] = Tile.Normal;
        grid.push(row);
      }
    } else if (seg === 'boost') {
      add(2, Tile.Normal);
      add(3 + rnd(3), Tile.Boost);
    } else if (seg === 'ice') {
      add(2, Tile.Normal);
      add(5 + rnd(4) + Math.round(d * 4), Tile.Ice);
    } else {
      // Cruise straight with occasional fuel pickups (rarer when harder).
      const n = Math.max(3, 5 + rnd(5) - Math.round(d * 3));
      const fuelChance = 0.28 - d * 0.16;
      for (let i = 0; i < n; i++) {
        const row = makeRow(Tile.Normal);
        if (Math.random() < fuelChance) row[rnd(LANES)] = Tile.Fuel;
        grid.push(row);
      }
    }
  }

  add(30, Tile.Normal); // solid finish straight

  return { grid, length: grid.length };
}

// The tile at (row, lane). Off the start counts as ground; past the end and
// outside the lanes count as empty.
export function tileAt(grid: Tile[][], row: number, lane: number): Tile {
  if (row < 0) return Tile.Normal;
  if (row >= grid.length) return Tile.Gap;
  if (lane < 0 || lane >= LANES) return Tile.Gap;
  return grid[row][lane];
}

// True if the tile is something you can rest on (anything but a gap).
export function isSolid(grid: Tile[][], row: number, lane: number): boolean {
  return tileAt(grid, row, lane) !== Tile.Gap;
}
