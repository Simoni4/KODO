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
  elevation: number; // 0 = base ice block, 1 = elevated plateau (+1 block up)
  warningExpiresAt?: number;
}

/**
 * Generates a procedural 4-fold rotationally symmetric Survival Arena.
 * Every contestant spawns at an identical symmetric position with zero advantage.
 * Supports 2-tier 3D elevations (0 and 1) so players can hop 1 block up & 1 block down.
 */
export function initSurvivalArena(size: number = 14): {
  tiles: Map<string, SurvivalTileState>;
  players: SurvivalEntity[];
  archetypeName: string;
} {
  const tiles = new Map<string, SurvivalTileState>();

  // 4-fold rotational symmetry helper around the (size x size) grid
  const setSymmetricTile = (x: number, y: number, elevation: number = 0) => {
    const coords: [number, number][] = [
      [x, y],
      [y, size - 1 - x],
      [size - 1 - x, size - 1 - y],
      [size - 1 - y, x],
    ];
    for (const [cx, cy] of coords) {
      if (cx >= 0 && cx < size && cy >= 0 && cy < size) {
        tiles.set(`${cx},${cy}`, {
          x: cx,
          y: cy,
          state: 'stable',
          elevation,
        });
      }
    }
  };

  const removeSymmetricTile = (x: number, y: number) => {
    const coords: [number, number][] = [
      [x, y],
      [y, size - 1 - x],
      [size - 1 - x, size - 1 - y],
      [size - 1 - y, x],
    ];
    for (const [cx, cy] of coords) {
      tiles.delete(`${cx},${cy}`);
    }
  };

  const archetypes = [
    'Octagon Frost Citadel',
    'Four Islands Fortress',
    'Colosseum Ice Ring',
    'Starlight Cross Sanctuary',
  ];
  const archetypeIdx = Math.floor(Math.random() * archetypes.length);
  const archetypeName = archetypes[archetypeIdx];

  // Base octagon canvas (clips extreme corners symmetrically)
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const distCorner =
        Math.min(x, size - 1 - x) + Math.min(y, size - 1 - y);
      if (distCorner >= 3) {
        setSymmetricTile(x, y, 0);
      }
    }
  }

  // Apply procedural symmetric variations based on archetype
  if (archetypeIdx === 0) {
    // Octagon Frost Citadel: Elevated central plateau (elevation 1) with symmetric holes
    for (let y = 5; y <= 8; y++) {
      for (let x = 5; x <= 8; x++) {
        setSymmetricTile(x, y, 1);
      }
    }
    // Random symmetric corner pillars or gaps
    if (Math.random() > 0.4) {
      setSymmetricTile(4, 6, 1);
      setSymmetricTile(6, 4, 1);
    }
    if (Math.random() > 0.5) {
      removeSymmetricTile(2, 6);
    }
  } else if (archetypeIdx === 1) {
    // Four Islands Fortress: 4 corner islands connected by wide bridges to a raised center
    for (let i = 1; i <= 2; i++) {
      removeSymmetricTile(6, 1 + i);
      removeSymmetricTile(7, 1 + i);
    }
    for (let y = 5; y <= 8; y++) {
      for (let x = 5; x <= 8; x++) {
        setSymmetricTile(x, y, 1);
      }
    }
    // Symmetric raised ridges on each quadrant
    setSymmetricTile(3, 9, 1);
    setSymmetricTile(4, 9, 1);
  } else if (archetypeIdx === 2) {
    // Colosseum Ice Ring: Raised outer ring terraces with central pit / bridges
    removeSymmetricTile(6, 6);
    for (let d = 4; d <= 9; d++) {
      setSymmetricTile(4, d, 1);
    }
    // Ensure step-up access from spawn (3, 10) -> (3, 9) -> (4, 9)
    setSymmetricTile(3, 10, 0);
    setSymmetricTile(3, 9, 0);
    setSymmetricTile(5, 6, 0);
  } else {
    // Starlight Cross Sanctuary: Cross-shaped central high ground + symmetric side pockets
    removeSymmetricTile(2, 2);
    removeSymmetricTile(2, 3);
    removeSymmetricTile(3, 2);
    for (let k = 4; k <= 9; k++) {
      setSymmetricTile(6, k, 1);
      setSymmetricTile(7, k, 1);
    }
  }

  // Add 1-2 extra procedural symmetric feature tweaks so no two matches are identical
  const randFeature = Math.floor(Math.random() * 3);
  if (randFeature === 0) {
    setSymmetricTile(4, 8, 1);
  } else if (randFeature === 1) {
    setSymmetricTile(5, 9, 1);
  } else {
    removeSymmetricTile(1, 5);
  }

  // Guarantee the 4 symmetric spawn pads and their immediate neighbors are always stable & walkable
  const baseSpawn = { x: 3, y: 10 };
  const spawnNeighborhood: [number, number][] = [
    [baseSpawn.x, baseSpawn.y],
    [baseSpawn.x + 1, baseSpawn.y],
    [baseSpawn.x, baseSpawn.y - 1],
    [baseSpawn.x + 1, baseSpawn.y - 1],
  ];
  for (const [sx, sy] of spawnNeighborhood) {
    setSymmetricTile(sx, sy, 0);
  }

  // 4 contestants: Player + 3 Bots at exact 90-degree rotational symmetry
  const players: SurvivalEntity[] = [
    { id: 'player', name: 'Kodo', x: 3, y: 10, isPlayer: true, color: '#38bdf8', alive: true },
    { id: 'bot1', name: 'Frosty', x: 10, y: 10, isPlayer: false, color: '#f87171', alive: true },
    { id: 'bot2', name: 'Blizzard', x: 10, y: 3, isPlayer: false, color: '#c084fc', alive: true },
    { id: 'bot3', name: 'Pipsqueak', x: 3, y: 3, isPlayer: false, color: '#facc15', alive: true },
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
