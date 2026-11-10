export type GameMode = 'campaign' | 'race' | 'survival' | 'arena';

export interface Point {
  x: number;
  y: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Crate {
  id: string;
  x: number;
  y: number;
  type?: 'wood' | 'banded';
}

export type GateColor = 'green' | 'blue' | 'red' | 'yellow' | 'iron';

export interface Gate {
  id: string;
  x: number;
  y: number;
  color: GateColor;
  isOpen: boolean;
}

export interface SwitchButton {
  id: string;
  x: number;
  y: number;
  color: GateColor;
  isPressed: boolean;
}

export type EnemyType = 'chaser' | 'patrol' | 'bug' | 'mine';

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  patrolPath?: Point[];
  patrolIndex?: number;
  alive: boolean;
}

export interface LevelData {
  id: string;
  name: string;
  worldName?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  grid: number[][]; // 0 = void/abyss, 1 = snow dirt, 2 = snow rock, 3 = grass dirt
  playerStart: Point;
  finish: Point;
  crates: Crate[];
  gates: Gate[];
  switches: SwitchButton[];
  enemies: Enemy[];
  parMoves: number;
  parSeconds: number;
  hint?: string;
}

export interface BotRacer {
  id: string;
  name: string;
  color: string;
  avatar: string;
  x: number;
  y: number;
  spawn: Point;
  personality: 'aggressive' | 'cautious' | 'tricky';
  alive: boolean;
  score: number;
  nextMoveAt?: number;
  fallAnimation?: number;
}

export interface SurvivalTile {
  x: number;
  y: number;
  type: number;
  state: 'stable' | 'warning' | 'crumbling' | 'crumbled';
  shakeTime?: number;
}
