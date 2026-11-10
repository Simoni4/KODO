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

  // Randomized but mirrored spawn lanes. Every lane gets the same route after rotation.
  const spawnOptions: Point[] = [
    { x: 0, y: 15 }, { x: 1, y: 16 }, { x: 2, y: 16 },
    { x: 0, y: 14 }, { x: 1, y: 15 },
  ];
  const start = spawnOptions[Math.floor(Math.random() * spawnOptions.length)];
  const route: Point[] = [{ ...start }];
  let cursor = { ...start };

  // Add a small opening dog-leg so routes are not just a straight diagonal.
  const detour = cursor.x > 0 ? { x: -1, y: 0 } : { x: 1, y: 0 };
  cursor = { x: cursor.x + detour.x, y: cursor.y + detour.y };
  route.push({ ...cursor });
  cursor = { x: cursor.x - detour.x, y: cursor.y - detour.y };
  route.push({ ...cursor });

  // Randomly interleave the required east/north steps. The path shape changes each round.
  const moves = [
    ...Array(Math.max(0, RACE_CENTER - cursor.x)).fill('right'),
    ...Array(Math.max(0, cursor.y - RACE_CENTER)).fill('up'),
  ] as ('right' | 'up')[];
  for (let i = moves.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [moves[i], moves[j]] = [moves[j], moves[i]];
  }
  for (const move of moves) {
    cursor = move === 'right'
      ? { x: cursor.x + 1, y: cursor.y }
      : { x: cursor.x, y: cursor.y - 1 };
    route.push({ ...cursor });
  }

  const elevations = route.map((_, index) => (index > 2 && index % 5 === 0 ? 1 : 0));
  for (let rotation = 0; rotation < 4; rotation++) {
    route.forEach((point, index) => {
      const p = rotatePoint(point, rotation);
      grid[p.y][p.x] = elevations[index] + 1;
    });
  }

  // Random low obstacle clusters, mirrored to preserve equal opportunities.
  const candidates: Point[] = [];
  for (let y = 7; y <= 15; y++) {
    for (let x = 1; x <= 7; x++) {
      if (Math.abs(x - y) > 1 && Math.random() < 0.24) candidates.push({ x, y });
    }
  }
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  let placed = 0;
  for (const candidate of candidates) {
    if (placed >= 5) break;
    const orbit = [0, 1, 2, 3].map((turn) => rotatePoint(candidate, turn));
    if (orbit.some((p) => grid[p.y][p.x] > 0)) continue;
    for (const p of orbit) grid[p.y][p.x] = 2;
    placed++;
  }

  // Small raised ledges add visual variety without tall sight-blocking walls.
  for (let y = 6; y <= 14; y++) {
    for (let x = 2; x <= 7; x++) {
      if (Math.random() > 0.08) continue;
      for (let turn = 0; turn < 4; turn++) {
        const p = rotatePoint({ x, y }, turn);
        if (grid[p.y][p.x] === 0) grid[p.y][p.x] = 2;
      }
    }
  }

  return {
    size: RACE_SIZE,
    grid,
    finish: { x: RACE_CENTER, y: RACE_CENTER },
    spawns: [0, 1, 2, 3].map((turn) => rotatePoint(start, turn)),
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
 * Creates a winding, multi-height race course with low, visibility-friendly obstacles.
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
  // Retry with a fresh randomized candidate; mirrored construction preserves fairness.
  return createComplexRaceCandidate();
}
