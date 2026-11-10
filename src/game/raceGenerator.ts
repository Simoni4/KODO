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
export function generateFairRaceArena(size: number = 14): RaceArena {
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
