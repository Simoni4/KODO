import { Point } from './types';

export interface RaceArena {
  size: number;
  grid: number[][]; // 0 = abyss, 1 = height 0, 2 = height 1 (+1 block), 3 = height 2 (+2 blocks)
  finish: Point;
  spawns: Point[];
}

/**
 * Procedurally generates a 14x14 4-fold rotationally symmetric 3D Race Arena.
 * Guarantees that all 4 racers (Player + 3 AI Bots) have identical path length,
 * identical elevation climbs (+1 / -1 block steps), and zero directional advantage.
 */
function generateRaceArenaCandidate(size: number = 14): RaceArena {
  const center = 6; // Exact 4-fold rotational center (6, 6) inside the 14x14 grid
  const maxSym = center * 2; // 12 (0..12 symmetric span, with index 13 as outer glacier rim)
  const grid: number[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => 0)
  );

  // Paint a cell with strict 4-fold rotational symmetry around (center, center):
  // (x, y) -> (y, maxSym - x) -> (maxSym - x, maxSym - y) -> (maxSym - y, x)
  const setSymmetric = (x: number, y: number, val: number = 1) => {
    const coords: [number, number][] = [
      [x, y],
      [y, maxSym - x],
      [maxSym - x, maxSym - y],
      [maxSym - y, x],
    ];
    for (const [cx, cy] of coords) {
      if (cx >= 0 && cx < size && cy >= 0 && cy < size) {
        grid[cy][cx] = val;
      }
    }
  };

  // Choose one of 3 procedural symmetric 14x14 race layouts + random symmetric bridges
  const variant = Math.floor(Math.random() * 3);

  // 1. Outer Ring & Spawn Corridors (Height 0 -> tileVal = 1)
  for (let step = 1; step <= 6; step++) {
    setSymmetric(1, step, 1);
    setSymmetric(step, 1, 1);
    setSymmetric(2, step, 1);
    setSymmetric(step, 2, 1);
  }
  for (let y = 6; y <= 11; y++) {
    setSymmetric(1, y, 1);
    setSymmetric(2, y, 1);
  }
  for (let x = 1; x <= 6; x++) {
    setSymmetric(x, 11, 1);
    setSymmetric(x, 10, 1);
  }

  // 2. Mid-Tier Ring & Bridges (Height 0 & Height 1 -> tileVal = 1 or 2)
  if (variant === 0) {
    // Classic Stepped Pyramid Citadel (14x14)
    for (let step = 3; step <= 6; step++) {
      setSymmetric(4, step, 1);
      setSymmetric(step, 4, 1);
    }
    setSymmetric(3, 10, 1);
    setSymmetric(3, 9, 1);
    setSymmetric(4, 9, 1);
    setSymmetric(4, 8, 2);
    setSymmetric(4, 7, 2);
    setSymmetric(5, 7, 2);
  } else if (variant === 1) {
    // Twin Spiral Overpass (14x14)
    for (let step = 2; step <= 6; step++) {
      setSymmetric(4, step, 2);
      setSymmetric(step, 4, 2);
    }
    setSymmetric(3, 8, 1);
    setSymmetric(4, 8, 2);
    setSymmetric(3, 6, 1);
    setSymmetric(4, 6, 2);
  } else {
    // Glacier Cross-Bridges (14x14)
    for (let d = 2; d <= 5; d++) {
      setSymmetric(center, center + d, d === 2 ? 2 : 1);
      setSymmetric(center - 1, center + d, 1);
    }
    for (let step = 3; step <= 6; step++) {
      setSymmetric(3, step, 1);
      setSymmetric(4, step, 2);
    }
  }

  // Procedural extra symmetric shortcut
  if (Math.random() > 0.4) {
    setSymmetric(3, 7, 1);
    setSymmetric(5, 8, 2);
  }

  // Add small symmetric terrain variations. The validator below rejects any
  // candidate that makes the four legal shortest routes unequal or unreachable.
  const featureCandidates: [number, number][] = [
    [3, 3], [3, 4], [4, 3], [4, 4],
    [3, 5], [5, 3], [4, 5], [5, 4],
  ];
  for (let i = 0; i < 2; i++) {
    const featureIndex = Math.floor(Math.random() * featureCandidates.length);
    const [featureX, featureY] = featureCandidates.splice(featureIndex, 1)[0];
    const roll = Math.random();
    const featureHeight = roll < 0.18 ? 0 : roll < 0.62 ? 1 : 2;
    setSymmetric(featureX, featureY, featureHeight);
  }

  // 3. Center Podium Platform (3x3 at 5..7, 5..7)
  // Outer rim of podium is height 1 (val=2) and exact center finish is height 2 (val=3, +2 blocks up!)
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      grid[center + dy][center + dx] = 2;
    }
  }
  grid[center][center] = 3; // Elevated Summit Crown!

  // Ensure smooth 1-block elevation transitions along cardinal approaches to center:
  setSymmetric(center, 11, 1);
  setSymmetric(center, 10, 1);
  setSymmetric(center, 9, 1);
  setSymmetric(center, 8, 1);
  setSymmetric(center, 7, 2);

  // 4 fair spawn pads on outer symmetric corners: (1, 11), (11, 11), (11, 1), (1, 1)
  const baseSpawn: Point = { x: 1, y: 11 };
  const spawns: Point[] = [
    { x: baseSpawn.x, y: baseSpawn.y },                     // Player (SW)
    { x: baseSpawn.y, y: maxSym - baseSpawn.x },            // Bot 1 (SE)
    { x: maxSym - baseSpawn.x, y: maxSym - baseSpawn.y },   // Bot 2 (NE)
    { x: maxSym - baseSpawn.y, y: baseSpawn.x },            // Bot 3 (NW)
  ];

  for (const s of spawns) {
    grid[s.y][s.x] = 1;
  }

  return {
    size,
    grid,
    finish: { x: center, y: center },
    spawns,
  };
}


/**
 * Verifies the properties that make a generated race fair:
 * - the playable 13x13 area is 4-fold rotationally symmetric;
 * - all four spawns and the finish are reachable using legal one-level steps;
 * - every racer has the same shortest distance and the same number of shortest routes.
 */
export function isRaceArenaFair(arena: RaceArena): boolean {
  const { size, grid, finish, spawns } = arena;
  const center = Math.floor((size - 2) / 2);
  const maxSym = center * 2;

  if (size < maxSym + 1 || grid.length !== size || grid.some((row) => row.length !== size)) {
    return false;
  }
  if (spawns.length !== 4) return false;

  for (let y = 0; y <= maxSym; y++) {
    for (let x = 0; x <= maxSym; x++) {
      const orbit: [number, number][] = [
        [x, y],
        [y, maxSym - x],
        [maxSym - x, maxSym - y],
        [maxSym - y, x],
      ];
      const value = grid[y][x];
      if (orbit.some(([rx, ry]) => grid[ry][rx] !== value)) return false;
    }
  }

  const isInsideAndWalkable = (p: Point) =>
    p.x >= 0 && p.x < size && p.y >= 0 && p.y < size && grid[p.y][p.x] > 0;

  if (!isInsideAndWalkable(finish) || spawns.some((spawn) => !isInsideAndWalkable(spawn))) {
    return false;
  }

  const shortestRouteStats = (start: Point): { distance: number; routes: number } => {
    const distances = Array.from({ length: size }, () => Array<number>(size).fill(-1));
    const routeCounts = Array.from({ length: size }, () => Array<number>(size).fill(0));
    const queue: Point[] = [start];
    let head = 0;

    distances[start.y][start.x] = 0;
    routeCounts[start.y][start.x] = 1;

    const directions = [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ] as const;

    while (head < queue.length) {
      const current = queue[head++];
      for (const [dx, dy] of directions) {
        const x = current.x + dx;
        const y = current.y + dy;
        if (x < 0 || x >= size || y < 0 || y >= size) continue;

        const fromHeight = grid[current.y][current.x];
        const toHeight = grid[y][x];
        if (toHeight <= 0 || Math.abs(toHeight - fromHeight) > 1) continue;

        const nextDistance = distances[current.y][current.x] + 1;
        if (distances[y][x] === -1) {
          distances[y][x] = nextDistance;
          routeCounts[y][x] = routeCounts[current.y][current.x];
          queue.push({ x, y });
        } else if (distances[y][x] === nextDistance) {
          routeCounts[y][x] += routeCounts[current.y][current.x];
        }
      }
    }

    return {
      distance: distances[finish.y][finish.x],
      routes: routeCounts[finish.y][finish.x],
    };
  };

  const results = spawns.map(shortestRouteStats);
  const first = results[0];
  return (
    first.distance >= 0 &&
    first.routes > 0 &&
    results.every((result) =>
      result.distance === first.distance && result.routes === first.routes
    )
  );
}

/** Returns a simple, symmetric connected arena if random candidates ever fail validation. */
function createSafeFallbackArena(size: number): RaceArena {
  const grid = Array.from({ length: size }, () => Array<number>(size).fill(0));
  const center = 6;

  for (let y = 1; y <= 11; y++) {
    for (let x = 1; x <= 11; x++) {
      grid[y][x] = 1;
    }
  }
  for (let y = center - 1; y <= center + 1; y++) {
    for (let x = center - 1; x <= center + 1; x++) {
      grid[y][x] = 2;
    }
  }
  grid[center][center] = 3;

  return {
    size,
    grid,
    finish: { x: center, y: center },
    spawns: [
      { x: 1, y: 11 },
      { x: 11, y: 11 },
      { x: 11, y: 1 },
      { x: 1, y: 1 },
    ],
  };
}

/**
 * Extends the original symmetric arena with four equal-length approach corridors.
 * This adds four moves to every route without giving any racer a directional advantage.
 */
function expandRaceArena(base: RaceArena): RaceArena {
  const size = 18;
  const offset = 2;
  const grid = Array.from({ length: size }, () => Array<number>(size).fill(0));

  for (let y = 0; y < base.size; y++) {
    for (let x = 0; x < base.size; x++) {
      const targetX = x + offset;
      const targetY = y + offset;
      if (targetX < size && targetY < size) grid[targetY][targetX] = base.grid[y][x];
    }
  }

  // Four rotationally symmetric corridors, each exactly four steps long.
  const corridors: Point[][] = [
    [{ x: 1, y: 15 }, { x: 1, y: 14 }, { x: 1, y: 13 }, { x: 2, y: 13 }, { x: 3, y: 13 }],
    [{ x: 15, y: 15 }, { x: 15, y: 14 }, { x: 15, y: 13 }, { x: 14, y: 13 }, { x: 13, y: 13 }],
    [{ x: 15, y: 1 }, { x: 15, y: 2 }, { x: 15, y: 3 }, { x: 14, y: 3 }, { x: 13, y: 3 }],
    [{ x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }],
  ];
  for (const corridor of corridors) {
    for (const point of corridor) grid[point.y][point.x] = 1;
  }

  return {
    size,
    grid,
    finish: { x: base.finish.x + offset, y: base.finish.y + offset },
    spawns: [
      { x: 1, y: 15 },
      { x: 15, y: 15 },
      { x: 15, y: 1 },
      { x: 1, y: 1 },
    ],
  };
}

/**
 * Generates candidates until the route validator confirms equal, legal race routes.
 * AI Race uses an extended 18x18 board so each racer must make a longer approach to the summit.
 */
export function generateFairRaceArena(size: number = 14): RaceArena {
  if (size >= 18) {
    for (let attempt = 0; attempt < 40; attempt++) {
      const base = generateRaceArenaCandidate(14);
      if (!isRaceArenaFair(base)) continue;
      const extended = expandRaceArena(base);
      if (isRaceArenaFair(extended)) return extended;
    }
    return expandRaceArena(createSafeFallbackArena(14));
  }

  for (let attempt = 0; attempt < 40; attempt++) {
    const candidate = generateRaceArenaCandidate(size);
    if (isRaceArenaFair(candidate)) return candidate;
  }

  return createSafeFallbackArena(size);
}
