import { Point } from './types';

export function getDirectionDelta(dir: 'up' | 'down' | 'left' | 'right'): { dx: number; dy: number } {
  switch (dir) {
    case 'up':
      return { dx: 0, dy: -1 };
    case 'down':
      return { dx: 0, dy: 1 };
    case 'left':
      return { dx: -1, dy: 0 };
    case 'right':
      return { dx: 1, dy: 0 };
  }
}

export function resolvePushDestination(cratePos: Point, dx: number, dy: number): Point {
  return {
    x: cratePos.x + dx,
    y: cratePos.y + dy,
  };
}

export function canPushCrate(
  cratePos: Point,
  dx: number,
  dy: number,
  isCellBlocked: (x: number, y: number) => boolean
): boolean {
  const dest = resolvePushDestination(cratePos, dx, dy);
  return !isCellBlocked(dest.x, dest.y);
}
