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

function makeRow(fill: Tile): Tile[] {
  return new Array<Tile>(LANES).fill(fill);
}

// The generator stitches together segments that are passable by construction:
// cruise straights (with the occasional fuel pickup), jump gaps, lava strips you
// must clear, lava lanes you strafe around, boost pads, narrowing corridors and
// slippery ice patches.
export function generateLevel(totalRows = 480): Level {
  const grid: Tile[][] = [];

  const add = (n: number, fill: Tile) => {
    for (let i = 0; i < n; i++) grid.push(makeRow(fill));
  };

  add(14, Tile.Normal); // gentle, fully solid intro

  while (grid.length < totalRows - 30) {
    const roll = Math.random();

    if (roll < 0.18) {
      // Jump gap: run-up, a two-row hole, then a landing strip.
      add(3 + rnd(3), Tile.Normal);
      add(2, Tile.Gap);
      add(3, Tile.Normal);
    } else if (roll < 0.32) {
      // Lava strip you must jump (full-width, two rows).
      add(3 + rnd(2), Tile.Normal);
      add(2, Tile.Lava);
      add(3, Tile.Normal);
    } else if (roll < 0.46) {
      // Lava lanes to strafe around — always leaves a safe path.
      add(3, Tile.Normal);
      const base = makeRow(Tile.Normal);
      const lavaA = rnd(LANES);
      base[lavaA] = Tile.Lava;
      if (Math.random() < 0.5) {
        base[(lavaA + 1 + rnd(LANES - 1)) % LANES] = Tile.Lava;
      }
      for (let i = 0; i < 4 + rnd(3); i++) grid.push([...base]);
    } else if (roll < 0.58) {
      // Narrowing corridor: only a few adjacent lanes remain solid.
      const width = 2 + rnd(2);
      const lo = rnd(LANES - width + 1);
      add(4, Tile.Normal);
      for (let i = 0; i < 4 + rnd(4); i++) {
        const row = makeRow(Tile.Gap);
        for (let l = lo; l < lo + width; l++) row[l] = Tile.Normal;
        grid.push(row);
      }
    } else if (roll < 0.72) {
      // Boost pad strip.
      add(2, Tile.Normal);
      add(3 + rnd(3), Tile.Boost);
    } else if (roll < 0.84) {
      // Slippery ice patch.
      add(2, Tile.Normal);
      add(5 + rnd(4), Tile.Ice);
    } else {
      // Cruise straight with occasional fuel pickups.
      const n = 5 + rnd(5);
      for (let i = 0; i < n; i++) {
        const row = makeRow(Tile.Normal);
        if (Math.random() < 0.25) row[rnd(LANES)] = Tile.Fuel;
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
