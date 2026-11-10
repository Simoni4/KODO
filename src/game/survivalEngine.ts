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

/** Spacious, fully open survival field with scattered low platforms and gaps. */
export function initSurvivalArena(size: number = 22): {
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
    'Open Ice Field',
    'Scattered Frost Platforms',
    'Broken Ice Plain',
    'Four Island Arena',
  ];
  const archetypeIdx = Math.floor(Math.random() * archetypes.length);

  // Entire board is playable ground: no perimeter walls, fences or raised rim.
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) setTile(x, y, 0);
  }

  // Low platforms form different patterns in each generated layout.
  if (archetypeIdx === 0) {
    for (const [x, y] of [[5, 5], [10, 5], [15, 5], [5, 10], [15, 10], [5, 15], [10, 15], [15, 15]]) setSymmetric(x, y, 1);
  } else if (archetypeIdx === 1) {
    for (const [x, y] of [[5, 8], [6, 8], [7, 8], [8, 9], [9, 10], [10, 11]]) setSymmetric(x, y, 1);
    setSymmetric(10, 10, 2);
  } else if (archetypeIdx === 2) {
    for (let i = 4; i <= size - 5; i += 2) {
      setSymmetric(5, i, 1);
      setSymmetric(15, i, 1);
    }
    setSymmetric(10, 10, 2);
  } else {
    for (const [x, y] of [[5, 5], [6, 5], [5, 6], [14, 5], [15, 5], [15, 6], [5, 14], [5, 15], [6, 15]]) setSymmetric(x, y, 1);
  }

  // Random small holes and low blocks keep each match slightly different.
  const gapCandidates: Point[] = [
    { x: 4, y: 8 }, { x: 6, y: 12 }, { x: 8, y: 4 },
    { x: 10, y: 6 }, { x: 12, y: 9 }, { x: 14, y: 13 },
  ];
  const shuffledGaps = [...gapCandidates].sort(() => Math.random() - 0.5);
  for (const point of shuffledGaps.slice(0, 2 + Math.floor(Math.random() * 3))) {
    removeSymmetric(point.x, point.y);
  }

  const low = 3;
  const high = size - 1 - low;
  const spawnPads: Point[] = [
    { x: low, y: high },
    { x: high, y: high },
    { x: high, y: low },
    { x: low, y: low },
  ];
  for (const spawn of spawnPads) {
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
      setTile(spawn.x + dx, spawn.y + dy, 0);
    }
  }

  const players: SurvivalEntity[] = [
    { id: 'player', name: 'Kodo', x: spawnPads[0].x, y: spawnPads[0].y, isPlayer: true, color: '#38bdf8', alive: true },
    { id: 'bot1', name: 'Frosty', x: spawnPads[1].x, y: spawnPads[1].y, isPlayer: false, color: '#f87171', alive: true },
    { id: 'bot2', name: 'Blizzard', x: spawnPads[2].x, y: spawnPads[2].y, isPlayer: false, color: '#c084fc', alive: true },
    { id: 'bot3', name: 'Pipsqueak', x: spawnPads[3].x, y: spawnPads[3].y, isPlayer: false, color: '#facc15', alive: true },
  ];
  return { tiles, players, archetypeName: archetypes[archetypeIdx] };
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
