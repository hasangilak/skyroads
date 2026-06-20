import { LANES } from './constants';

// A level is a grid of rows; each row is an array of `LANES` booleans where
// `true` means a solid block and `false` means open space (a gap to fall through).
//
// The generator stitches together a few segment types that are passable by
// construction: cruise straights, two-row jump gaps (always preceded by a
// run-up and followed by a landing), and narrowing corridors.

export interface Level {
  grid: boolean[][];
  length: number;
}

function fullRow(): boolean[] {
  return new Array(LANES).fill(true);
}

function narrowRow(lo: number, hi: number): boolean[] {
  const row = new Array(LANES).fill(false);
  for (let l = lo; l <= hi; l++) row[l] = true;
  return row;
}

export function generateLevel(totalRows = 420): Level {
  const grid: boolean[][] = [];

  const addFull = (n: number) => {
    for (let i = 0; i < n; i++) grid.push(fullRow());
  };
  const addGap = (n: number) => {
    for (let i = 0; i < n; i++) grid.push(new Array(LANES).fill(false));
  };
  const addNarrow = (lo: number, hi: number, n: number) => {
    for (let i = 0; i < n; i++) grid.push(narrowRow(lo, hi));
  };

  addFull(14); // gentle, fully solid intro

  while (grid.length < totalRows - 30) {
    const roll = Math.random();

    if (roll < 0.3) {
      // Jump: run-up, a two-row gap you must clear, then a landing strip.
      addFull(3 + Math.floor(Math.random() * 3));
      addGap(2);
      addFull(3);
    } else if (roll < 0.55) {
      // Narrowing corridor: only a few adjacent lanes remain solid.
      const width = 2 + Math.floor(Math.random() * 2); // 2 or 3 lanes
      const lo = Math.floor(Math.random() * (LANES - width + 1));
      addFull(4); // room to line up
      addNarrow(lo, lo + width - 1, 4 + Math.floor(Math.random() * 4));
    } else {
      // Straight cruise.
      addFull(5 + Math.floor(Math.random() * 5));
    }
  }

  addFull(30); // solid finish straight

  return { grid, length: grid.length };
}

// True if the tile at (row, lane) is solid ground.
export function isSolid(grid: boolean[][], row: number, lane: number): boolean {
  if (row < 0) return true; // treat pre-start as ground
  if (row >= grid.length) return false;
  if (lane < 0 || lane >= LANES) return false;
  return grid[row][lane];
}
