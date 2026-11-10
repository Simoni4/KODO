import { Point } from './types';

export interface SurvivalEntity {
  id: string;
  name: string;
  x: number;
  y: number;
  isPlayer: boolean;
  color: string;
  alive: boolean;
  knockedOutTime?: number;
}

export interface SurvivalTileState {
  x: number;
  y: number;
  state: 'stable' | 'warning' | 'crumbled';
  elevation: number;
  warningExpiresAt?: number;
}

const rotateArenaPoint = (x: number, y: number, size: number): Point => ({
  x: y,
  y: size - 1 - x,
});

/**
 * Builds a compact enclosed survival arena. A high, continuous perimeter wall
 * surrounds a lower play floor, with randomized symmetric platforms and gaps.
 * The four spawn pads are always safe, stable and at the same elevation.
 */
export function initSurvivalArena(size: number = 14): {
  tiles: Map<string, SurvivalTileState>;
  players: SurvivalEntity[];
  archetypeName: string;
} {
  const tiles = new Map<string, SurvivalTileState>();
  const setTile = (x: number, y: number, elevation = 0) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    tiles.set(`${x},${y}`, { x, y, state: 'stable', elevation });
  };
  const setSymmetric = (x: number, y: number, elevation = 0) => {
    let point = { x, y };
    for (let turn = 0; turn < 4; turn++) {
      setTile(point.x, point.y, elevation);
      point = rotateArenaPoint(point.x, point.y, size);
    }
  };
  const removeSymmetric = (x: number, y: number) => {
    let point = { x, y };
    for (let turn = 0; turn < 4; turn++) {
      tiles.delete(`${point.x},${point.y}`);
      point = rotateArenaPoint(point.x, point.y, size);
    }
  };

  const archetypes = [
    'Frostwall Colosseum',
    'Four-Pad Arena',
    'Broken Ice Courtyard',
    'Stepping-Stone Bowl',
  ];
  const archetypeIdx = Math.floor(Math.random() * archetypes.length);
  const archetypeName = archetypes[archetypeIdx];

  // Flat interior floor with a thick, unjumpable perimeter wall.
  // Wall elevation 3 cannot be entered from the floor (height difference > 1).
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const isWall = x === 1 || y === 1 || x === size - 2 || y === size - 2;
      setTile(x, y, isWall ? 3 : 0);
    }
  }

  // Arena-specific platform layouts. These are deliberately distributed around
  // the arena instead of always building a raised tower in the center.
  if (archetypeIdx === 0) {
    // Four short corner terraces and a low center.
    for (const [x, y] of [[4, 4], [9, 4], [9, 9], [4, 9]]) setSymmetric(x, y, 1);
    setSymmetric(6, 4, 1);
    setSymmetric(4, 6, 1);
  } else if (archetypeIdx === 1) {
    // Four separated raised pads, leaving wide lanes between them.
    for (const [x, y] of [[4, 5], [5, 5], [5, 4]]) setSymmetric(x, y, 1);
    setSymmetric(6, 6, 2);
  } else if (archetypeIdx === 2) {
    // A broken ring: gaps and small elevated islands, no central tower.
    for (let i = 4; i <= 9; i++) {
      setSymmetric(4, i, i % 2 === 0 ? 1 : 0);
    }
    removeSymmetric(6, 6);
    removeSymmetric(6, 7);
  } else {
    // Alternating stepping stones along the four sides.
    for (const [x, y] of [[3, 6], [4, 6], [5, 7], [6, 8], [7, 9]]) {
      setSymmetric(x, y, 1);
    }
    setSymmetric(6, 6, 0);
  }

  // Random symmetric gaps and isolated raised obstacles make each arena different.
  const gapCandidates: Point[] = [
    { x: 3, y: 3 }, { x: 3, y: 7 }, { x: 4, y: 8 },
    { x: 5, y: 3 }, { x: 5, y: 9 }, { x: 7, y: 4 },
  ];
  const shuffledGaps = [...gapCandidates].sort(() => Math.random() - 0.5);
  for (const point of shuffledGaps.slice(0, 1 + Math.floor(Math.random() * 3))) {
    removeSymmetric(point.x, point.y);
  }

  const obstacleCandidates: Point[] = [
    { x: 3, y: 5 }, { x: 4, y: 7 }, { x: 5, y: 8 }, { x: 7, y: 5 },
  ];
  for (const point of obstacleCandidates) {
    if (Math.random() < 0.35) setSymmetric(point.x, point.y, 3);
  }

  // Four equal spawn pads and their cardinal neighbours are guaranteed safe.
  const spawnPads: Point[] = [
    { x: 4, y: 9 }, { x: 9, y: 9 }, { x: 9, y: 4 }, { x: 4, y: 4 },
  ];
  for (const spawn of spawnPads) {
    setTile(spawn.x, spawn.y, 0);
    setTile(spawn.x + 1, spawn.y, 0);
    setTile(spawn.x - 1, spawn.y, 0);
    setTile(spawn.x, spawn.y + 1, 0);
    setTile(spawn.x, spawn.y - 1, 0);
  }

  const players: SurvivalEntity[] = [
    { id: 'player', name: 'Kodo', x: spawnPads[0].x, y: spawnPads[0].y, isPlayer: true, color: '#38bdf8', alive: true },
    { id: 'bot1', name: 'Frosty', x: spawnPads[1].x, y: spawnPads[1].y, isPlayer: false, color: '#f87171', alive: true },
    { id: 'bot2', name: 'Blizzard', x: spawnPads[2].x, y: spawnPads[2].y, isPlayer: false, color: '#c084fc', alive: true },
    { id: 'bot3', name: 'Pipsqueak', x: spawnPads[3].x, y: spawnPads[3].y, isPlayer: false, color: '#facc15', alive: true },
  ];

  return { tiles, players, archetypeName };
}

export function processPush(
  attackerPos: Point,
  victimPos: Point,
  dx: number,
  dy: number,
  isCellWalkable: (x: number, y: number) => boolean
): { pushedTo: Point; fell: boolean } {
  const targetX = victimPos.x + dx;
  const targetY = victimPos.y + dy;
  if (!isCellWalkable(targetX, targetY)) {
    return { pushedTo: { x: targetX, y: targetY }, fell: true };
  }
  return { pushedTo: { x: targetX, y: targetY }, fell: false };
}
