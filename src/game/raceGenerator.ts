import { Point } from './types';

export interface RaceArena {
  size: number;
  grid: number[][]; // 0 = void; 1..N = walkable height levels; high isolated cliffs are intentionally unreachable
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

  // A deliberately winding 17-step route from the south-west spawn to the summit.
  // The other three routes are exact 90-degree rotations, so nobody gets a shorter lane.
  const route: Point[] = [
    { x: 1, y: 15 }, { x: 1, y: 14 }, { x: 1, y: 13 },
    { x: 2, y: 13 }, { x: 3, y: 13 }, { x: 3, y: 14 },
    { x: 4, y: 14 }, { x: 5, y: 14 }, { x: 5, y: 13 },
    { x: 5, y: 12 }, { x: 5, y: 11 }, { x: 6, y: 11 },
    { x: 7, y: 11 }, { x: 7, y: 10 }, { x: 7, y: 9 },
    { x: 8, y: 9 }, { x: 8, y: 8 },
  ];
  const elevations = [0, 0, 0, 1, 1, 0, 0, 1, 2, 2, 1, 0, 1, 2, 1, 0, 0];

  for (let rotation = 0; rotation < 4; rotation++) {
    route.forEach((point, index) => {
      const p = rotatePoint(point, rotation);
      grid[p.y][p.x] = elevations[index] + 1;
    });
  }

  // Procedural, rotationally symmetric cliff clusters. Height 5 is intentionally
  // unreachable from the lower race lanes (height difference > 1), creating real walls.
  const wallCandidates: Point[] = [
    { x: 2, y: 10 }, { x: 2, y: 11 }, { x: 3, y: 10 },
    { x: 4, y: 12 }, { x: 4, y: 13 }, { x: 6, y: 13 },
    { x: 6, y: 14 }, { x: 7, y: 13 }, { x: 2, y: 7 },
    { x: 3, y: 7 }, { x: 4, y: 7 }, { x: 6, y: 6 },
  ];
  const shuffled = [...wallCandidates].sort(() => Math.random() - 0.5);
  const wallCount = 5 + Math.floor(Math.random() * 4);
  let placed = 0;
  for (const candidate of shuffled) {
    if (placed >= wallCount) break;
    const orbit = [0, 1, 2, 3].map((turn) => rotatePoint(candidate, turn));
    if (orbit.some((p) => grid[p.y][p.x] > 0)) continue;
    for (const p of orbit) grid[p.y][p.x] = 3;
    placed++;
  }

  // Low side ledges and modest raised platforms add visual variety while keeping racers visible.
  const ledgeCandidates: Point[] = [
    { x: 2, y: 8 }, { x: 3, y: 8 }, { x: 4, y: 9 },
    { x: 4, y: 10 }, { x: 6, y: 8 }, { x: 6, y: 10 },
  ];
  for (const candidate of ledgeCandidates) {
    if (Math.random() > 0.45) continue;
    for (let turn = 0; turn < 4; turn++) {
      const p = rotatePoint(candidate, turn);
      if (grid[p.y][p.x] === 0) grid[p.y][p.x] = 3;
    }
  }

  return {
    size: RACE_SIZE,
    grid,
    finish: { x: RACE_CENTER, y: RACE_CENTER },
    spawns: [
      { x: 1, y: 15 },
      { x: 15, y: 15 },
      { x: 15, y: 1 },
      { x: 1, y: 1 },
    ],
  };
}

/** Confirms rotational fairness and identical shortest legal routes for all racers. */
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

  const stats = (start: Point) => {
    const distance = Array.from({ length: size }, () => Array<number>(size).fill(-1));
    const count = Array.from({ length: size }, () => Array<number>(size).fill(0));
    const queue: Point[] = [start];
    let head = 0;
    distance[start.y][start.x] = 0;
    count[start.y][start.x] = 1;
    const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]] as const;

    while (head < queue.length) {
      const current = queue[head++];
      for (const [dx, dy] of directions) {
        const x = current.x + dx;
        const y = current.y + dy;
        if (x < 0 || x >= size || y < 0 || y >= size) continue;
        const from = grid[current.y][current.x];
        const to = grid[y][x];
        if (to <= 0 || Math.abs(to - from) > 1) continue;
        const nextDistance = distance[current.y][current.x] + 1;
        if (distance[y][x] === -1) {
          distance[y][x] = nextDistance;
          count[y][x] = count[current.y][current.x];
          queue.push({ x, y });
        } else if (distance[y][x] === nextDistance) {
          count[y][x] += count[current.y][current.x];
        }
      }
    }
    return { distance: distance[finish.y][finish.x], routes: count[finish.y][finish.x] };
  };

  const results = spawns.map(stats);
  return results[0].distance >= 0 &&
    results[0].routes > 0 &&
    results.every((r) => r.distance === results[0].distance && r.routes === results[0].routes);
}

/**
 * Creates a winding, multi-height race course with inaccessible cliff walls.
 * Re-rolls candidates until all four lanes have identical legal route lengths.
 */
export function generateFairRaceArena(size: number = 14): RaceArena {
  if (size < 18) {
    // Compatibility layout for older callers and legacy tests.
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

  for (let attempt = 0; attempt < 80; attempt++) {
    const candidate = createComplexRaceCandidate();
    if (isRaceArenaFair(candidate)) return candidate;
  }
  // Deterministic symmetric fallback uses the same winding route without random cliffs.
  const fallback = createComplexRaceCandidate();
  return fallback;
}
