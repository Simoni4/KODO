import { Point } from './types';

export function bfsShortestPath(
  start: Point,
  target: Point,
  isWalkable: (x: number, y: number) => boolean,
  width: number,
  height: number
): Point[] | null {
  if (start.x === target.x && start.y === target.y) {
    return [];
  }

  const queue: Point[] = [start];
  const visited = new Set<string>();
  const parent = new Map<string, Point | null>();

  const key = (p: Point) => `${p.x},${p.y}`;
  visited.add(key(start));
  parent.set(key(start), null);

  const directions = [
    { x: 0, y: -1 }, // up
    { x: 0, y: 1 },  // down
    { x: -1, y: 0 }, // left
    { x: 1, y: 0 },  // right
  ];

  let reached = false;

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.x === target.x && current.y === target.y) {
      reached = true;
      break;
    }

    for (const dir of directions) {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;
      const nextPoint = { x: nx, y: ny };
      const nextKey = key(nextPoint);

      if (
        nx >= 0 &&
        nx < width &&
        ny >= 0 &&
        ny < height &&
        !visited.has(nextKey)
      ) {
        // Can walk if isWalkable is true or if it is the target itself
        if (isWalkable(nx, ny) || (nx === target.x && ny === target.y)) {
          visited.add(nextKey);
          parent.set(nextKey, current);
          queue.push(nextPoint);
        }
      }
    }
  }

  if (!reached) return null;

  // Reconstruct path (excluding start point, including target)
  const path: Point[] = [];
  let curr: Point | null = target;
  while (curr && !(curr.x === start.x && curr.y === start.y)) {
    path.unshift(curr);
    const p = parent.get(key(curr));
    curr = p || null;
  }

  return path;
}
