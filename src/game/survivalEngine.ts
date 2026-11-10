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
 * Creates a spacious 18x18 survival arena. The rear and side rims are low,
 * while the front edge is deliberately open so the camera never looks through
 * a tall foreground wall. Raised pads are small and distributed around the floor.
 */
export function initSurvivalArena(size: number = 18): {
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
    'Open Frost Colosseum',
    'Four-Pad Arena',
    'Broken Ice Courtyard',
    'Stepping-Stone Bowl',
  ];
  const archetypeIdx = Math.floor(Math.random() * archetypes.length);
  const archetypeName = archetypes[archetypeIdx];

  // Broad, flat play floor. The rear and side rims are only two levels high;
  // the near/front rim is omitted to preserve an unobstructed view of every bird.
  for (let y = 2; y <= size - 2; y++) {
    for (let x = 2; x <= size - 2; x++) {
      const isRearOrSideRim = y === 2 || x === 2 || x === size - 3;
      setTile(x, y, isRearOrSideRim ? 2 : 0);
    }
  }

  // Four distinct but compact layouts, with a low center and no tall central tower.
  if (archetypeIdx === 0) {
    for (const [x, y] of [[5, 5], [12, 5], [12, 12], [5, 12]]) setSymmetric(x, y, 1);
    setSymmetric(7, 5, 1);
    setSymmetric(5, 7, 1);
  } else if (archetypeIdx === 1) {
    for (const [x, y] of [[5, 7], [6, 7], [6, 6]]) setSymmetric(x, y, 1);
    setSymmetric(8, 8, 2);
  } else if (archetypeIdx === 2) {
    for (let i = 5; i <= 12; i++) {
      if (i % 2 === 0) setSymmetric(5, i, 1);
    }
    removeSymmetric(7, 7);
    removeSymmetric(7, 8);
  } else {
    for (const [x, y] of [[4, 8], [5, 8], [6, 9], [7, 10], [8, 11]]) {
      setSymmetric(x, y, 1);
    }
    setSymmetric(8, 8, 0);
  }

  // A few random holes and small raised blocks create changing routes without
  // filling the arena with high obstacles.
  const gapCandidates: Point[] = [
    { x: 4, y: 4 }, { x: 4, y: 8 }, { x: 5, y: 10 },
    { x: 6, y: 4 }, { x: 7, y: 12 }, { x: 9, y: 5 },
  ];
  const shuffledGaps = [...gapCandidates].sort(() => Math.random() - 0.5);
  for (const point of shuffledGaps.slice(0, 1 + Math.floor(Math.random() * 3))) {
    removeSymmetric(point.x, point.y);
  }

  const obstacleCandidates: Point[] = [
    { x: 4, y: 6 }, { x: 5, y: 9 }, { x: 7, y: 11 }, { x: 9, y: 7 },
  ];
  for (const point of obstacleCandidates) {
    if (Math.random() < 0.3) setSymmetric(point.x, point.y, 2);
  }

  // Spawn pads sit well inside the arena, with a clear first move in every direction.
  const low = Math.floor(size / 2) - 3;
  const high = size - 1 - low;
  const spawnPads: Point[] = [
    { x: low, y: high },
    { x: high, y: high },
    { x: high, y: low },
    { x: low, y: low },
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
