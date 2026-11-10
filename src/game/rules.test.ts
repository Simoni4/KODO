import test from 'node:test';
import assert from 'node:assert/strict';
import { bfsShortestPath } from './pathfinding';
import { generateFairRaceArena, isRaceArenaFair } from './raceGenerator';
import { canPushCrate, resolvePushDestination, getDirectionDelta } from './puzzleLogic';
import { initSurvivalArena, processPush } from './survivalEngine';
import { CAMPAIGN_LEVELS } from './campaignLevels';
import { IsometricRenderer } from './isometricRenderer';

test('Campaign levels contain all 18 9x9 3D multi-elevation levels with valid ground tiles', () => {
  assert.equal(CAMPAIGN_LEVELS.length, 18);
  for (let i = 0; i < CAMPAIGN_LEVELS.length; i++) {
    const lvl = CAMPAIGN_LEVELS[i];
    assert.ok(lvl.id, `Level ${i} has ID`);
    assert.ok(lvl.name, `Level ${i} has name`);
    assert.equal(lvl.grid.length, 9, `Level ${lvl.name} must have 9 rows`);
    for (let r = 0; r < 9; r++) {
      assert.equal(lvl.grid[r].length, 9, `Level ${lvl.name} row ${r} must have 9 cols`);
    }

    // Verify level is non-flat (has multiple 3D block elevations: 1, 2, 3...)
    const elevations = new Set<number>();
    for (const row of lvl.grid) {
      for (const cell of row) {
        if (cell > 0) elevations.add(cell);
      }
    }
    assert.ok(
      elevations.size >= 2,
      `Level ${lvl.name} must have multiple 3D elevations (found ${elevations.size})`
    );

    const isGround = (x: number, y: number) =>
      y >= 0 && y < lvl.grid.length && x >= 0 && x < lvl.grid[0].length && lvl.grid[y][x] > 0;

    assert.ok(
      isGround(lvl.playerStart.x, lvl.playerStart.y),
      `Level ${lvl.name} playerStart (${lvl.playerStart.x},${lvl.playerStart.y}) is on ground`
    );
    assert.ok(
      isGround(lvl.finish.x, lvl.finish.y),
      `Level ${lvl.name} finish (${lvl.finish.x},${lvl.finish.y}) is on ground`
    );
    assert.notDeepEqual(lvl.playerStart, lvl.finish, `Level ${lvl.name} start != finish`);

    for (const c of lvl.crates) {
      assert.ok(isGround(c.x, c.y), `Level ${lvl.name} crate ${c.id} at (${c.x},${c.y}) is on ground`);
    }
    for (const sw of lvl.switches) {
      assert.ok(isGround(sw.x, sw.y), `Level ${lvl.name} switch ${sw.id} at (${sw.x},${sw.y}) is on ground`);
    }
    for (const gt of lvl.gates) {
      assert.ok(isGround(gt.x, gt.y), `Level ${lvl.name} gate ${gt.id} at (${gt.x},${gt.y}) is on ground`);
    }
    for (const en of lvl.enemies) {
      assert.ok(isGround(en.x, en.y), `Level ${lvl.name} enemy ${en.id} at (${en.x},${en.y}) is on ground`);
      if (en.patrolPath) {
        for (const p of en.patrolPath) {
          assert.ok(
            isGround(p.x, p.y),
            `Level ${lvl.name} enemy ${en.id} patrol point (${p.x},${p.y}) is on ground`
          );
        }
      }
    }
  }
});

test('All 18 9x9 3D Campaign levels are solvable AND every switch/gate is a mandatory obstacle', () => {
  const dirs: ('up' | 'right' | 'down' | 'left')[] = ['up', 'right', 'down', 'left'];

  const canSolveLevel = (lvl: (typeof CAMPAIGN_LEVELS)[number], disabledSwitchIdx: number = -1) => {
    const isGround = (x: number, y: number) =>
      y >= 0 && y < lvl.grid.length && x >= 0 && x < lvl.grid[0].length && lvl.grid[y][x] > 0;

    const canStep3D = (x1: number, y1: number, x2: number, y2: number) => {
      if (!isGround(x1, y1) || !isGround(x2, y2)) return false;
      const h1 = lvl.grid[y1][x1] - 1;
      const h2 = lvl.grid[y2][x2] - 1;
      return Math.abs(h2 - h1) <= 1;
    };

    interface State {
      px: number;
      py: number;
      crates: { x: number; y: number }[];
      pressedSwitches: boolean[];
    }

    const encode = (s: State) =>
      `${s.px},${s.py}|${s.crates.map((c) => `${c.x},${c.y}`).join(';')}|${s.pressedSwitches
        .map((b) => (b ? '1' : '0'))
        .join('')}`;

    const initPressed = lvl.switches.map((sw, idx) => {
      if (idx === disabledSwitchIdx) return false;
      return (
        (lvl.playerStart.x === sw.x && lvl.playerStart.y === sw.y) ||
        lvl.crates.some((c) => c.x === sw.x && c.y === sw.y)
      );
    });

    const startState: State = {
      px: lvl.playerStart.x,
      py: lvl.playerStart.y,
      crates: lvl.crates.map((c) => ({ x: c.x, y: c.y })),
      pressedSwitches: initPressed,
    };

    const visited = new Set<string>([encode(startState)]);
    const queue: State[] = [startState];

    while (queue.length > 0 && visited.size < 25000) {
      const cur = queue.shift()!;
      if (cur.px === lvl.finish.x && cur.py === lvl.finish.y) {
        return true;
      }

      const isGateClosed = (gx: number, gy: number, pressed: boolean[]) => {
        for (const gt of lvl.gates) {
          if (gt.x === gx && gt.y === gy) {
            const matchingIdxs = lvl.switches
              .map((sw, idx) => (sw.color === gt.color ? idx : -1))
              .filter((idx) => idx !== -1);
            const isOpen = matchingIdxs.length > 0 && matchingIdxs.every((idx) => pressed[idx]);
            if (!isOpen) return true;
          }
        }
        return false;
      };

      for (const d of dirs) {
        const { dx, dy } = getDirectionDelta(d);
        const nx = cur.px + dx;
        const ny = cur.py + dy;

        if (!canStep3D(cur.px, cur.py, nx, ny)) continue;
        if (isGateClosed(nx, ny, cur.pressedSwitches)) continue;

        const crateIdx = cur.crates.findIndex((c) => c.x === nx && c.y === ny);
        const nextCrates = cur.crates.map((c) => ({ ...c }));

        if (crateIdx !== -1) {
          const cx = nx + dx;
          const cy = ny + dy;
          if (!canStep3D(nx, ny, cx, cy)) continue;
          if (isGateClosed(cx, cy, cur.pressedSwitches)) continue;
          if (cur.crates.some((c) => c.x === cx && c.y === cy)) continue;
          nextCrates[crateIdx] = { x: cx, y: cy };
        }

        const nextPressed = lvl.switches.map((sw, idx) => {
          if (idx === disabledSwitchIdx) return false;
          if (cur.pressedSwitches[idx]) return true;
          if (nx === sw.x && ny === sw.y) return true;
          if (nextCrates.some((c) => c.x === sw.x && c.y === sw.y)) return true;
          return false;
        });

        const nextState: State = {
          px: nx,
          py: ny,
          crates: nextCrates,
          pressedSwitches: nextPressed,
        };
        const key = encode(nextState);
        if (!visited.has(key)) {
          visited.add(key);
          queue.push(nextState);
        }
      }
    }
    return false;
  };

  for (const lvl of CAMPAIGN_LEVELS) {
    // 1. Level must be solvable normally
    assert.ok(
      canSolveLevel(lvl, -1),
      `3D Level "${lvl.name}" must be solvable with 1-block-up/down steps!`
    );

    // 2. If a level has switches, every single switch must be mandatory (unsolvable if that switch cannot be pressed!)
    if (lvl.switches.length > 0) {
      assert.ok(lvl.gates.length > 0, `Level "${lvl.name}" has switches so it must have gates!`);
      for (let swIdx = 0; swIdx < lvl.switches.length; swIdx++) {
        const solvableWithoutSwitch = canSolveLevel(lvl, swIdx);
        assert.equal(
          solvableWithoutSwitch,
          false,
          `Switch ${lvl.switches[swIdx].id} in "${lvl.name}" must control a mandatory obstacle that cannot be bypassed!`
        );
      }
    }
  }
});

test('Clockwise 4-direction indicator holds direction for 0.2s after stopping and then rotates every 0.5s', () => {
  const renderer = new IsometricRenderer();
  assert.equal(renderer.currentDirection, 'up');

  renderer.notifyPlayerHop('right');
  assert.equal(renderer.currentDirection, 'right');

  assert.equal(renderer.updateDirection(0.1, true), 'right');
  assert.equal(renderer.holdAfterStopRemaining, 0.2);

  assert.equal(renderer.updateDirection(0.15, false), 'right');

  renderer.notifyPlayerHop('right');
  assert.equal(renderer.updateDirection(0.12, false), 'right');

  assert.equal(renderer.updateDirection(0.1, false), 'down');

  assert.equal(renderer.updateDirection(0.51, false), 'left');
  assert.equal(renderer.updateDirection(0.51, false), 'up');
  assert.equal(renderer.updateDirection(0.51, false), 'right');
});

test('Procedural Fair Race Arena generates 14x14 4-fold symmetric 3D board with equal 1-block-climb distance to center flag', () => {
  for (let run = 0; run < 10; run++) {
    const arena = generateFairRaceArena(14);
    assert.equal(arena.size, 14);
    assert.deepEqual(arena.finish, { x: 6, y: 6 });
    assert.equal(arena.spawns.length, 4);
    assert.ok(isRaceArenaFair(arena), 'Arena must pass legal-route and equal-shortest-route validation');

    // Check 4-fold rotational symmetry around center (6,6) -> maxSym = 12
    const maxSym = 12;
    for (let y = 0; y <= maxSym; y++) {
      for (let x = 0; x <= maxSym; x++) {
        const tile = arena.grid[y][x];
        const rotTile: number = arena.grid[maxSym - x][y];
        assert.equal(tile, rotTile, `Symmetry failure at (${x},${y})`);
      }
    }

    // BFS with 3D elevation constraint (|h2 - h1| <= 1) from each of the 4 spawns to center
    const find3DDist = (start: { x: number; y: number }) => {
      const visited = new Set<string>([`${start.x},${start.y}`]);
      const q: { x: number; y: number; dist: number }[] = [{ x: start.x, y: start.y, dist: 0 }];
      while (q.length > 0) {
        const cur = q.shift()!;
        if (cur.x === arena.finish.x && cur.y === arena.finish.y) return cur.dist;
        for (const [dx, dy] of [
          [0, -1],
          [1, 0],
          [0, 1],
          [-1, 0],
        ]) {
          const nx = cur.x + dx;
          const ny = cur.y + dy;
          if (nx < 0 || nx >= 14 || ny < 0 || ny >= 14) continue;
          const v1 = arena.grid[cur.y][cur.x];
          const v2 = arena.grid[ny][nx];
          if (v2 <= 0 || Math.abs(v2 - v1) > 1) continue;
          const k = `${nx},${ny}`;
          if (!visited.has(k)) {
            visited.add(k);
            q.push({ x: nx, y: ny, dist: cur.dist + 1 });
          }
        }
      }
      return -1;
    };

    const dists = arena.spawns.map((s) => find3DDist(s));
    assert.ok(dists[0] > 0, 'Spawn 0 must have valid 3D path to center');
    assert.equal(dists[0], dists[1]);
    assert.equal(dists[1], dists[2]);
    assert.equal(dists[2], dists[3]);
  }
});

test('AI Race uses a longer 18x18 symmetric arena with equal legal routes', () => {
  for (let run = 0; run < 10; run++) {
    const arena = generateFairRaceArena(18);
    assert.equal(arena.size, 18);
    assert.deepEqual(arena.finish, { x: 8, y: 8 });
    assert.deepEqual(arena.spawns, [
      { x: 1, y: 15 },
      { x: 15, y: 15 },
      { x: 15, y: 1 },
      { x: 1, y: 1 },
    ]);
    assert.ok(isRaceArenaFair(arena));

    const isWalkable = (x: number, y: number) =>
      x >= 0 && x < arena.size && y >= 0 && y < arena.size && arena.grid[y][x] > 0;
    const canStep = (fromX: number, fromY: number, toX: number, toY: number) =>
      isWalkable(fromX, fromY) &&
      isWalkable(toX, toY) &&
      Math.abs(arena.grid[fromY][fromX] - arena.grid[toY][toX]) <= 1;

    const routes = arena.spawns.map((spawn) =>
      bfsShortestPath(spawn, arena.finish, isWalkable, arena.size, arena.size, canStep)
    );
    const routeLengths = routes.map((route) => route?.length ?? -1);
    assert.ok(routeLengths[0] >= 14, `Race route should be longer than the original 10-step run: ${routeLengths[0]}`);
    assert.ok(routeLengths.every((length) => length === routeLengths[0]));
  }
});

test('AI Race contains winding routes and isolated cliffs that cannot be jumped onto', () => {
  const arena = generateFairRaceArena(18);
  assert.ok(isRaceArenaFair(arena));
  assert.ok(arena.grid.some((row) => row.some((height) => height === 5)), 'Generated map should contain tall cliff walls');
  const isWalkable = (x: number, y: number) =>
    x >= 0 && x < arena.size && y >= 0 && y < arena.size && arena.grid[y][x] > 0;
  const canStep = (fromX: number, fromY: number, toX: number, toY: number) =>
    isWalkable(fromX, fromY) && isWalkable(toX, toY) &&
    Math.abs(arena.grid[fromY][fromX] - arena.grid[toY][toX]) <= 1;
  const route = bfsShortestPath(arena.spawns[0], arena.finish, isWalkable, arena.size, arena.size, canStep);
  assert.ok(route && route.length >= 16, 'Race route should require at least 16 moves');
  assert.ok(route?.some((point) => arena.grid[point.y][point.x] === 3), 'Route should include elevated platforms');
});

test('Procedural Survival Arena generates 14x14 4-fold symmetric 3D board with safe symmetric spawns', () => {
  for (let run = 0; run < 10; run++) {
    const { tiles, players } = initSurvivalArena(14);
    assert.equal(players.length, 4);

    for (const p of players) {
      const t = tiles.get(`${p.x},${p.y}`);
      assert.ok(t && t.state === 'stable', `Spawn for ${p.name} at (${p.x},${p.y}) must be stable`);
    }

    for (let y = 0; y < 14; y++) {
      for (let x = 0; x < 14; x++) {
        const t1 = tiles.get(`${x},${y}`);
        const t2 = tiles.get(`${y},${13 - x}`);
        assert.equal(Boolean(t1), Boolean(t2), `Survival tile existence symmetry at (${x},${y})`);
        if (t1 && t2) {
          assert.equal(
            t1.elevation,
            t2.elevation,
            `Survival tile elevation symmetry at (${x},${y})`
          );
        }
      }
    }
  }
});

test('Survival arena has a permanent high perimeter and safe inner spawn pads', () => {
  const { tiles, players } = initSurvivalArena(14);
  for (const player of players) {
    const spawn = tiles.get(`${player.x},${player.y}`);
    assert.ok(spawn && spawn.state === 'stable');
    assert.equal(spawn?.elevation, 0);
  }
  for (let i = 2; i <= 11; i++) {
    assert.equal(tiles.get(`${i},1`)?.elevation, 3);
    assert.equal(tiles.get(`${i},12`)?.elevation, 3);
    assert.equal(tiles.get(`1,${i}`)?.elevation, 3);
    assert.equal(tiles.get(`12,${i}`)?.elevation, 3);
  }
  assert.ok(Array.from(tiles.values()).some((tile) => tile.elevation === 1 || tile.elevation === 2));
});

test('Crate pushing and Survival push physics work accurately', () => {
  const isCellBlocked = (x: number, y: number) => x === 2 && y === 1;
  assert.equal(canPushCrate({ x: 1, y: 1 }, 1, 0, isCellBlocked), false);
  assert.equal(canPushCrate({ x: 1, y: 0 }, 0, 1, isCellBlocked), true);
  assert.deepEqual(resolvePushDestination({ x: 1, y: 0 }, 0, 1), { x: 1, y: 1 });

  const walkCheck = (x: number, y: number) => x >= 0 && x < 14 && y >= 0 && y < 14;
  const resultSafe = processPush({ x: 5, y: 5 }, { x: 6, y: 5 }, 1, 0, walkCheck);
  assert.deepEqual(resultSafe.pushedTo, { x: 7, y: 5 });
  assert.equal(resultSafe.fell, false);

  const resultEdge = processPush({ x: 12, y: 5 }, { x: 13, y: 5 }, 1, 0, walkCheck);
  assert.deepEqual(resultEdge.pushedTo, { x: 14, y: 5 });
  assert.equal(resultEdge.fell, true);
});


test('BFS rejects unreachable or non-walkable targets instead of routing through void', () => {
  const grid = [
    [1, 0],
    [0, 3],
  ];
  const isWalkable = (x: number, y: number) =>
    y >= 0 && y < grid.length && x >= 0 && x < grid[0].length && grid[y][x] > 0;
  const canTraverse = (fromX: number, fromY: number, toX: number, toY: number) =>
    Math.abs(grid[toY][toX] - grid[fromY][fromX]) <= 1;

  assert.equal(
    bfsShortestPath({ x: 0, y: 0 }, { x: 1, y: 1 }, isWalkable, 2, 2, canTraverse),
    null
  );
  assert.equal(
    bfsShortestPath({ x: 0, y: 0 }, { x: 1, y: 0 }, isWalkable, 2, 2),
    null
  );
});


test('BFS supports fair shortest-route personality preferences', () => {
  const isWalkable = (x: number, y: number) =>
    x >= 0 && x < 2 && y >= 0 && y < 2;
  const start = { x: 0, y: 0 };
  const finish = { x: 1, y: 1 };

  const defaultPath = bfsShortestPath(start, finish, isWalkable, 2, 2);
  const preferredPath = bfsShortestPath(
    start,
    finish,
    isWalkable,
    2,
    2,
    undefined,
    [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }]
  );

  assert.equal(defaultPath?.length, 2);
  assert.equal(preferredPath?.length, 2);
  assert.deepEqual(preferredPath?.[0], { x: 1, y: 0 });
});
