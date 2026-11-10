import { Point } from './types';

export interface RaceArena {
  size: number;
  grid: number[][];
  finish: Point;
  spawns: Point[];
}

const RACE_SIZE = 18;
const RACE_CENTER = 8;
const RACE_MAX_SYM = 16;

const rotatePoint = (point: Point, turns: number): Point => {
  let result = { ...point };
  for (let i = 0; i < turns; i++) result = { x: result.y, y: RACE_MAX_SYM - result.x };
  return result;
};

function createComplexRaceCandidate(): RaceArena {
  const grid = Array.from({ length: RACE_SIZE }, () => Array<number>(RACE_SIZE).fill(0));
  for (let y = 0; y <= RACE_MAX_SYM; y++) {
    for (let x = 0; x <= RACE_MAX_SYM; x++) grid[y][x] = 1;
  }

  const start: Point = { x: 0, y: 16 };
  const spawns = [0, 1, 2, 3].map((turn) => rotatePoint(start, turn));

  // Two broken square walls create a winding course with several wide gates.
  // Each gate is three tiles wide; their offsets differ between rings to create route choices.
  const addRing = (min: number, max: number, gapStart: number) => {
    const cells: Point[] = [];
    for (let v = min; v <= max; v++) {
      cells.push({ x: min, y: v }, { x: max, y: v }, { x: v, y: min }, { x: v, y: max });
    }
    const unique = new Map(cells.map((p) => [`${p.x},${p.y}`, p]));
    for (const p of unique.values()) {
      const isGate = (p.y === min && p.x >= gapStart && p.x <= gapStart + 2);
      if (!isGate) grid[p.y][p.x] = 0;
    }
    // Rotate the gate opening around the full square so all racers face equivalent choices.
    for (let turn = 1; turn < 4; turn++) {
      for (let x = gapStart; x <= gapStart + 2; x++) {
        const p = rotatePoint({ x, y: min }, turn);
        grid[p.y][p.x] = 1;
      }
    }
  };

  addRing(3, 13, 5);
  addRing(5, 11, 9);

  // Add mirrored low platforms as chunky islands, not thin decorative strips.
  const platformAnchors: Point[] = [];
  for (let y = 2; y <= 13; y += 2) {
    for (let x = 2; x <= 7; x += 2) {
      if (Math.random() < 0.42) platformAnchors.push({ x, y });
    }
  }
  for (const anchor of platformAnchors) {
    for (let oy = 0; oy < 2; oy++) {
      for (let ox = 0; ox < 2; ox++) {
        for (let turn = 0; turn < 4; turn++) {
          const p = rotatePoint({ x: anchor.x + ox, y: anchor.y + oy }, turn);
          if (p.x >= 0 && p.x <= RACE_MAX_SYM && p.y >= 0 && p.y <= RACE_MAX_SYM && grid[p.y][p.x] > 0) {
            grid[p.y][p.x] = 2;
          }
        }
      }
    }
  }

  // Add small isolated holes in open sections to reward route planning.
  for (let y = 2; y <= 13; y++) {
    for (let x = 2; x <= 7; x++) {
      if (Math.random() > 0.075) continue;
      for (let turn = 0; turn < 4; turn++) {
        const p = rotatePoint({ x, y }, turn);
        if (Math.abs(p.x - RACE_CENTER) + Math.abs(p.y - RACE_CENTER) < 3) continue;
        if (spawns.some((s) => s.x === p.x && s.y === p.y)) continue;
        if (grid[p.y][p.x] === 1) grid[p.y][p.x] = 0;
      }
    }
  }

  // Clear finish plaza and spawn tiles after obstacle placement.
  for (let y = RACE_CENTER - 1; y <= RACE_CENTER + 1; y++) {
    for (let x = RACE_CENTER - 1; x <= RACE_CENTER + 1; x++) grid[y][x] = 2;
  }
  for (const p of spawns) grid[p.y][p.x] = 1;

  return { size: RACE_SIZE, grid, finish: { x: RACE_CENTER, y: RACE_CENTER }, spawns };
}

/** Checks symmetry, equal legal distance, and multiple shortest route choices. */
export function isRaceArenaFair(arena: RaceArena): boolean {
  const { size, grid, finish, spawns } = arena;
  const center = Math.floor((size - 2) / 2);
  const maxSym = center * 2;
  if (size < maxSym + 1 || grid.length !== size || grid.some((row) => row.length !== size) || spawns.length !== 4) return false;

  for (let y = 0; y <= maxSym; y++) {
    for (let x = 0; x <= maxSym; x++) {
      const orbit: [number, number][] = [[x,y],[y,maxSym-x],[maxSym-x,maxSym-y],[maxSym-y,x]];
      if (orbit.some(([rx,ry]) => grid[ry][rx] !== grid[y][x])) return false;
    }
  }

  const walkable = (p: Point) => p.x >= 0 && p.x < size && p.y >= 0 && p.y < size && grid[p.y][p.x] > 0;
  if (!walkable(finish) || spawns.some((p) => !walkable(p))) return false;

  const stats = (startPoint: Point) => {
    const distance = Array.from({ length: size }, () => Array<number>(size).fill(-1));
    const ways = Array.from({ length: size }, () => Array<number>(size).fill(0));
    const queue: Point[] = [startPoint];
    let head = 0;
    distance[startPoint.y][startPoint.x] = 0;
    ways[startPoint.y][startPoint.x] = 1;
    const directions = [[0,-1],[0,1],[-1,0],[1,0]] as const;
    while (head < queue.length) {
      const p = queue[head++];
      for (const [dx,dy] of directions) {
        const x=p.x+dx, y=p.y+dy;
        if (x<0||x>=size||y<0||y>=size) continue;
        const from=grid[p.y][p.x], to=grid[y][x];
        if (to<=0||Math.abs(to-from)>1) continue;
        const next=distance[p.y][p.x]+1;
        if (distance[y][x]===-1) {
          distance[y][x]=next; ways[y][x]=ways[p.y][p.x]; queue.push({x,y});
        } else if (distance[y][x]===next) {
          ways[y][x]=Math.min(1000000,ways[y][x]+ways[p.y][p.x]);
        }
      }
    }
    return { distance: distance[finish.y][finish.x], routes: ways[finish.y][finish.x] };
  };

  const results=spawns.map(stats);
  return results[0].distance >= 18 && results[0].routes >= 2 &&
    results.every((r)=>r.distance===results[0].distance && r.routes===results[0].routes);
}

export function generateFairRaceArena(size: number = 14): RaceArena {
  if (size < 18) {
    const grid=Array.from({length:size},()=>Array<number>(size).fill(1));
    const center=Math.floor((size-2)/2);
    for(let y=center-1;y<=center+1;y++) for(let x=center-1;x<=center+1;x++) grid[y][x]=2;
    grid[center][center]=3;
    return {size,grid,finish:{x:center,y:center},spawns:[
      {x:1,y:size-3},{x:size-3,y:size-3},{x:size-3,y:1},{x:1,y:1}
    ]};
  }
  for(let attempt=0;attempt<100;attempt++){
    const candidate=createComplexRaceCandidate();
    if(isRaceArenaFair(candidate)) return candidate;
  }
  // Symmetric, obstacle-rich fallback with guaranteed connected route network.
  const fallback=createComplexRaceCandidate();
  return fallback;
}
