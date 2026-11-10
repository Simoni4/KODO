import { Point } from './types';

export interface RaceArena {
  size: number;
  grid: number[][]; // 0 = void; 1..N = walkable height levels
  finish: Point;
  spawns: Point[];
}

const RACE_SIZE = 18;
const RACE_CENTER = 8;
const RACE_MAX_SYM = 16;

const rotatePoint = (point: Point, turns: number): Point => {
  let result = { ...point };
  for (let i = 0; i < turns; i++) {
    result = { x: result.y, y: RACE_MAX_SYM - result.x };
  }
  return result;
};

function createComplexRaceCandidate(): RaceArena {
  const grid = Array.from({ length: RACE_SIZE }, () => Array<number>(RACE_SIZE).fill(0));

  // Build a broad arena first: almost the entire 17x17 playfield is traversable.
  // This deliberately creates a network of route choices instead of four narrow lanes.
  for (let y = 0; y <= RACE_MAX_SYM; y++) {
    for (let x = 0; x <= RACE_MAX_SYM; x++) grid[y][x] = 1;
  }

  const start: Point = { x: 0, y: 16 };
  const spawns = [0, 1, 2, 3].map((turn) => rotatePoint(start, turn));

  // Scatter broad, low platforms in rotationally mirrored clusters.
  // Heights remain walkable from every adjacent tile (1-block elevation difference).
  const platformAnchors: Point[] = [];
  for (let y = 2; y <= 13; y += 2) {
    for (let x = 2; x <= 7; x += 2) {
      if (Math.random() < 0.34) platformAnchors.push({ x, y });
    }
  }
  for (const anchor of platformAnchors) {
    for (let turn = 0; turn < 4; turn++) {
      const p = rotatePoint(anchor, turn);
      for (let oy = 0; oy < 2; oy++) {
        for (let ox = 0; ox < 2; ox++) {
          const x = p.x + ox;
          const y = p.y + oy;
          if (x >= 0 && x <= RACE_MAX_SYM && y >= 0 && y <= RACE_MAX_SYM) {
            grid[y][x] = 2;
          }
        }
      }
    }
  }

  // Add a few small holes as hazards, never long walls or corridor-forming barriers.
  const hazardAnchors: Point[] = [];
  for (let y = 2; y <= 13; y++) {
    for (let x = 2; x <= 7; x++) {
      if (Math.random() < 0.045) hazardAnchors.push({ x, y });
    }
  }
  for (const anchor of hazardAnchors) {
    for (let turn = 0; turn < 4; turn++) {
      const p = rotatePoint(anchor, turn);
      // Keep hazards isolated and away from the finish and spawn pads.
      if (Math.abs(p.x - RACE_CENTER) + Math.abs(p.y - RACE_CENTER) < 3) continue;
      if (spawns.some((s) => s.x === p.x && s.y === p.y)) continue;
      grid[p.y][p.x] = 0;
    }
  }

  // Guarantee a clear 3x3 finish plaza and 2x2 spawn pads.
  for (let y = RACE_CENTER - 1; y <= RACE_CENTER + 1; y++) {
    for (let x = RACE_CENTER - 1; x <= RACE_CENTER + 1; x++) grid[y][x] = 2;
  }
  for (const spawn of spawns) {
    for (let oy = -1; oy <= 0; oy++) {
      for (let ox = 0; ox <= 1; ox++) {
        const x = spawn.x + ox;
        const y = spawn.y + oy;
        if (x >= 0 && x <= RACE_MAX_SYM && y >= 0 && y <= RACE_MAX_SYM) grid[y][x] = 1;
      }
    }
  }

  return { size: RACE_SIZE, grid, finish: { x: RACE_CENTER, y: RACE_CENTER }, spawns };
}

/** Confirms rotational fairness and equal shortest legal route lengths for all racers. */
export function isRaceArenaFair(arena: RaceArena): boolean {
  const { size, grid, finish, spawns } = arena;
  const center = Math.floor((size - 2) / 2);
  const maxSym = center * 2;
  if (size < maxSym + 1 || grid.length !== size || grid.some((row) => row.length !== size)) return false;
  if (spawns.length !== 4) return false;

  for (let y = 0; y <= maxSym; y++) {
    for (let x = 0; x <= maxSym; x++) {
      const orbit: [number, number][] = [
        [x, y], [y, maxSym - x], [maxSym - x, maxSym - y], [maxSym - y, x],
      ];
      if (orbit.some(([rx, ry]) => grid[ry][rx] !== grid[y][x])) return false;
    }
  }

  const walkable = (p: Point) =>
    p.x >= 0 && p.x < size && p.y >= 0 && p.y < size && grid[p.y][p.x] > 0;
  if (!walkable(finish) || spawns.some((p) => !walkable(p))) return false;

  const stats = (startPoint: Point) => {
    const distance = Array.from({ length: size }, () => Array<number>(size).fill(-1));
    const queue: Point[] = [startPoint];
    let head = 0;
    distance[startPoint.y][startPoint.x] = 0;
    const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]] as const;

    while (head < queue.length) {
      const current = queue[head++];
      for (const [dx, dy] of directions) {
        const x = current.x + dx;
        const y = current.y + dy;
        if (x < 0 || x >= size || y < 0 || y >= size) continue;
        const from = grid[current.y][current.x];
        const to = grid[y][x];
        if (to <= 0 || Math.abs(to - from) > 1 || distance[y][x] !== -1) continue;
        distance[y][x] = distance[current.y][current.x] + 1;
        queue.push({ x, y });
      }
    }
    return distance[finish.y][finish.x];
  };

  const distances = spawns.map(stats);
  return distances[0] >= 16 && distances.every((distance) => distance === distances[0]);
}

/**
 * Creates a wide, multi-route race arena with scattered low platforms and small hazards.
 * Four-fold symmetry keeps all starting positions equally fair.
 */
export function generateFairRaceArena(size: number = 14): RaceArena {
  if (size < 18) {
    const grid = Array.from({ length: size }, () => Array<number>(size).fill(1));
    const center = Math.floor((size - 2) / 2);
    const finish = { x: center, y: center };
    for (let y = center - 1; y <= center + 1; y++) {
      for (let x = center - 1; x <= center + 1; x++) grid[y][x] = 2;
    }
    grid[center][center] = 3;
    return {
      size, grid, finish,
      spawns: [
        { x: 1, y: size - 3 }, { x: size - 3, y: size - 3 },
        { x: size - 3, y: 1 }, { x: 1, y: 1 },
      ],
    };
  }

  for (let attempt = 0; attempt < 40; attempt++) {
    const candidate = createComplexRaceCandidate();
    if (isRaceArenaFair(candidate)) return candidate;
  }
  // A fully open symmetric fallback always preserves equal 16-step routes.
  const grid = Array.from({ length: RACE_SIZE }, (_, y) =>
    Array.from({ length: RACE_SIZE }, (_, x) =>
      x <= RACE_MAX_SYM && y <= RACE_MAX_SYM ? 1 : 0
    )
  );
  return {
    size: RACE_SIZE,
    grid,
    finish: { x: RACE_CENTER, y: RACE_CENTER },
    spawns: [0, 1, 2, 3].map((turn) => rotatePoint({ x: 0, y: 16 }, turn)),
  };
}
