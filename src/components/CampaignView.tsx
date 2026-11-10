import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LevelData, Point, Crate, SwitchButton, Gate, Enemy } from '../game/types';
import { bfsShortestPath } from '../game/pathfinding';
import { getDirectionDelta, canPushCrate, resolvePushDestination } from '../game/puzzleLogic';
import { IsometricRenderer } from '../game/isometricRenderer';
import { KodoAudioManager } from '../game/audio';

interface CampaignViewProps {
  level: LevelData;
  isPaused?: boolean;
  playerColor?: string;
  onWin: (stars: number, moves: number, timeSeconds: number) => void;
  onLose: (reason: string) => void;
  onMovesChange?: (moves: number) => void;
}

export const CampaignView: React.FC<CampaignViewProps> = ({
  level,
  isPaused = false,
  playerColor = '#0284c7',
  onWin,
  onLose,
  onMovesChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<IsometricRenderer>(new IsometricRenderer());

  // Gameplay State
  const [playerPos, setPlayerPos] = useState<Point>({ ...level.playerStart });
  const [crates, setCrates] = useState<Crate[]>(level.crates.map((c) => ({ ...c })));
  const [switches, setSwitches] = useState<SwitchButton[]>(level.switches.map((s) => ({ ...s })));
  const [gates, setGates] = useState<Gate[]>(level.gates.map((g) => ({ ...g })));
  const [enemies, setEnemies] = useState<Enemy[]>(level.enemies.map((e) => ({ ...e })));
  const [moves, setMoves] = useState<number>(0);

  // Synchronous refs for instant jump series (серія стрибків) & smooth 60fps loop
  const playerPosRef = useRef<Point>({ ...level.playerStart });
  const cratesRef = useRef<Crate[]>(level.crates.map((c) => ({ ...c })));
  const switchesRef = useRef<SwitchButton[]>(level.switches.map((s) => ({ ...s })));
  const gatesRef = useRef<Gate[]>(level.gates.map((g) => ({ ...g })));
  const enemiesRef = useRef<Enemy[]>(level.enemies.map((e) => ({ ...e })));
  const movesRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(isPaused);
  const levelFinishedRef = useRef<boolean>(false);

  const isJumpingRef = useRef<boolean>(false);
  const jumpStartRef = useRef<number>(0);
  const jumpFromRef = useRef<Point>({ ...level.playerStart });
  const jumpToRef = useRef<Point>({ ...level.playerStart });
  const facingRef = useRef<'left' | 'right' | 'front'>('front');

  // Animated 4-direction clockwise arrow & tap refs
  const currentClockwiseDirRef = useRef<'up' | 'right' | 'down' | 'left'>('up');
  const lastHopTimeRef = useRef<number>(0);

  // Animation refs
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const globalTimeRef = useRef<number>(0);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const isGroundCell = useCallback(
    (x: number, y: number) => {
      if (y < 0 || y >= level.grid.length || x < 0 || x >= level.grid[0].length) {
        return false;
      }
      return level.grid[y][x] > 0;
    },
    [level.grid]
  );

  // 3D Elevation helper: tileVal = 1 -> elev 0; 2 -> elev 1; 3 -> elev 2; 4 -> elev 3
  const getElevation = useCallback(
    (x: number, y: number): number => {
      if (y < 0 || y >= level.grid.length || x < 0 || x >= level.grid[0].length) {
        return 0;
      }
      return Math.max(0, level.grid[y][x] - 1);
    },
    [level.grid]
  );

  // Can step 1 block UP (+1), 1 block DOWN (-1), or same elevation (0)
  const canStepElevation = useCallback(
    (fromX: number, fromY: number, toX: number, toY: number): boolean => {
      if (!isGroundCell(fromX, fromY) || !isGroundCell(toX, toY)) return false;
      const h1 = getElevation(fromX, fromY);
      const h2 = getElevation(toX, toY);
      return Math.abs(h2 - h1) <= 1;
    },
    [isGroundCell, getElevation]
  );

  const isGateBlocked = useCallback((x: number, y: number, currentGates: Gate[]) => {
    return currentGates.some((g) => g.x === x && g.y === y && !g.isOpen);
  }, []);

  const evaluateSwitchesAndGates = useCallback(
    (
      pPos: Point,
      currentCrates: Crate[],
      currentSwitches: SwitchButton[],
      currentGates: Gate[]
    ) => {
      let switchChanged = false;
      const nextSwitches = currentSwitches.map((sw) => {
        const isOccupied =
          (pPos.x === sw.x && pPos.y === sw.y) ||
          currentCrates.some((c) => c.x === sw.x && c.y === sw.y);
        const nextPressed = sw.isPressed || isOccupied;
        if (nextPressed !== sw.isPressed) {
          switchChanged = true;
        }
        return { ...sw, isPressed: nextPressed };
      });

      if (switchChanged) {
        KodoAudioManager.playSwitch();
      }

      const nextGates = currentGates.map((gt) => {
        const matchingSwitches = nextSwitches.filter((sw) => sw.color === gt.color);
        const allPressed =
          matchingSwitches.length > 0 && matchingSwitches.every((sw) => sw.isPressed);
        return { ...gt, isOpen: allPressed };
      });

      return { nextSwitches, nextGates };
    },
    []
  );

  // Execute Move (Supports immediate jump series chaining!)
  const handleMove = useCallback(
    (dir: 'up' | 'down' | 'left' | 'right') => {
      if (isPausedRef.current || levelFinishedRef.current) return;

      const now = performance.now();
      if (now - lastHopTimeRef.current < 45) return;
      lastHopTimeRef.current = now;

      // Lock direction during hop + 0.2s after stopping so player can chain a jump series in same direction!
      rendererRef.current.notifyPlayerHop(dir);
      currentClockwiseDirRef.current = dir;

      const { dx, dy } = getDirectionDelta(dir);
      facingRef.current = dir === 'left' || dir === 'up' ? 'left' : 'right';

      const curPos = playerPosRef.current;
      const targetX = curPos.x + dx;
      const targetY = curPos.y + dy;

      if (!isGroundCell(targetX, targetY)) return;
      // Enforce 3D 1-block up / 1-block down rule
      if (!canStepElevation(curPos.x, curPos.y, targetX, targetY)) return;
      if (isGateBlocked(targetX, targetY, gatesRef.current)) return;

      const curCrates = cratesRef.current;
      const crateIdx = curCrates.findIndex((c) => c.x === targetX && c.y === targetY);
      const nextCrates = [...curCrates];

      if (crateIdx !== -1) {
        const crate = curCrates[crateIdx];
        const isCellBlocked = (cx: number, cy: number) => {
          if (!isGroundCell(cx, cy)) return true;
          if (!canStepElevation(crate.x, crate.y, cx, cy)) return true;
          if (isGateBlocked(cx, cy, gatesRef.current)) return true;
          if (curCrates.some((c) => c.x === cx && c.y === cy)) return true;
          return false;
        };

        if (!canPushCrate(crate, dx, dy, isCellBlocked)) return;

        const crateDest = resolvePushDestination(crate, dx, dy);
        nextCrates[crateIdx] = { ...crate, x: crateDest.x, y: crateDest.y };
        KodoAudioManager.playPush();
      }

      jumpFromRef.current = { ...curPos };
      jumpToRef.current = { x: targetX, y: targetY };
      isJumpingRef.current = true;
      jumpStartRef.current = now;
      KodoAudioManager.playHop();

      // Update logical position immediately so rapid taps in a jump series chain from the new tile!
      const nextPos = { x: targetX, y: targetY };
      playerPosRef.current = nextPos;
      cratesRef.current = nextCrates;
      setPlayerPos(nextPos);
      setCrates(nextCrates);

      const newMoves = movesRef.current + 1;
      movesRef.current = newMoves;
      setMoves(newMoves);
      onMovesChange?.(newMoves);

      const canvas = canvasRef.current;
      const { originX, originY } = rendererRef.current.configureGridMetrics(
        canvas?.width || 720,
        canvas?.height || 860,
        level.grid[0].length,
        level.grid.length
      );
      const targetElev = getElevation(targetX, targetY);
      const iso = rendererRef.current.gridToIso(targetX, targetY, originX, originY, targetElev);
      rendererRef.current.addDustPuff(iso.x, iso.y + 16);

      const nextEnemies = [...enemiesRef.current];
      const enemyOnTile = nextEnemies.find((e) => e.x === targetX && e.y === targetY && e.alive);

      if (enemyOnTile) {
        if (enemyOnTile.type === 'bug') {
          enemyOnTile.alive = false;
          KodoAudioManager.playSquash();
          rendererRef.current.addVictoryStars(iso.x, iso.y);
        } else {
          levelFinishedRef.current = true;
          KodoAudioManager.playDefeat();
          onLose(`You ran into the ${enemyOnTile.type}!`);
          return;
        }
      }

      const { nextSwitches, nextGates } = evaluateSwitchesAndGates(
        nextPos,
        nextCrates,
        switchesRef.current,
        gatesRef.current
      );
      switchesRef.current = nextSwitches;
      gatesRef.current = nextGates;
      setSwitches(nextSwitches);
      setGates(nextGates);

      if (targetX === level.finish.x && targetY === level.finish.y) {
        levelFinishedRef.current = true;
        KodoAudioManager.playVictory();
        rendererRef.current.addVictoryStars(iso.x, iso.y - 15);

        let stars = 3;
        if (newMoves > level.parMoves * 1.5) stars = 1;
        else if (newMoves > level.parMoves) stars = 2;

        setTimeout(() => onWin(stars, newMoves, 0), 100);
        return;
      }

      // Enemy movement
      const updatedEnemies = nextEnemies.map((enemy) => {
        if (!enemy.alive) return enemy;

        if (enemy.type === 'chaser') {
          const isWalkableForChaser = (cx: number, cy: number) => {
            if (!isGroundCell(cx, cy)) return false;
            if (isGateBlocked(cx, cy, nextGates)) return false;
            if (nextCrates.some((c) => c.x === cx && c.y === cy)) return false;
            return true;
          };

          const path = bfsShortestPath(
            { x: enemy.x, y: enemy.y },
            nextPos,
            isWalkableForChaser,
            level.grid[0].length,
            level.grid.length
          );

          if (path && path.length > 0) {
            const nextStep = path[0];
            if (!canStepElevation(enemy.x, enemy.y, nextStep.x, nextStep.y)) {
              return enemy;
            }
            if (nextStep.x === targetX && nextStep.y === targetY) {
              levelFinishedRef.current = true;
              setTimeout(() => {
                KodoAudioManager.playDefeat();
                onLose('The red imp caught Kodo!');
              }, 160);
            }
            return { ...enemy, x: nextStep.x, y: nextStep.y };
          }
        } else if (enemy.type === 'patrol' && enemy.patrolPath) {
          const nextIdx = ((enemy.patrolIndex || 0) + 1) % enemy.patrolPath.length;
          const nextP = enemy.patrolPath[nextIdx];
          if (nextP.x === targetX && nextP.y === targetY) {
            levelFinishedRef.current = true;
            setTimeout(() => {
              KodoAudioManager.playDefeat();
              onLose('The purple phantom caught Kodo!');
            }, 160);
          }
          return { ...enemy, x: nextP.x, y: nextP.y, patrolIndex: nextIdx };
        } else if (enemy.type === 'mine' && enemy.patrolPath) {
          const nextIdx = ((enemy.patrolIndex || 0) + 1) % enemy.patrolPath.length;
          const nextP = enemy.patrolPath[nextIdx];
          if (nextP.x === targetX && nextP.y === targetY) {
            levelFinishedRef.current = true;
            setTimeout(() => {
              KodoAudioManager.playDefeat();
              onLose('Stepped on the spiked mine!');
            }, 160);
          }
          return { ...enemy, x: nextP.x, y: nextP.y, patrolIndex: nextIdx };
        }

        return enemy;
      });

      enemiesRef.current = updatedEnemies;
      setEnemies(updatedEnemies);
    },
    [
      isGroundCell,
      canStepElevation,
      getElevation,
      isGateBlocked,
      onMovesChange,
      evaluateSwitchesAndGates,
      level.finish,
      level.parMoves,
      level.grid,
      onWin,
      onLose,
    ]
  );

  useEffect(() => {
    (window as any).__KODO_MOVE__ = handleMove;
    return () => {
      delete (window as any).__KODO_MOVE__;
    };
  }, [handleMove]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        handleMove('up');
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        handleMove('down');
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        handleMove('left');
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        handleMove('right');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove]);

  // ONE-TAP SCREEN HANDLER - Strictly moves in the active clockwise arrow direction!
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (isPausedRef.current || levelFinishedRef.current) return;
    handleMove(currentClockwiseDirRef.current);
  };

  // Main 60fps Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let active = true;

    const render = (time: number) => {
      if (!active) return;
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;
      globalTimeRef.current += dt;
      const animTime = globalTimeRef.current;

      const renderer = rendererRef.current;
      renderer.updateParticles(dt);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      renderer.renderSnowflakes(ctx, width, height);

      const rows = level.grid.length;
      const cols = level.grid[0].length;
      const { originX, originY } = renderer.configureGridMetrics(width, height, cols, rows);

      interface Drawable {
        sortKey: number;
        draw: () => void;
      }
      const drawables: Drawable[] = [];

      // 1. Seamless 3D Multi-Elevation Grid Blocks
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const tileVal = level.grid[y][x];
          if (tileVal === 0) continue;

          const baseIso = renderer.gridToIso(x, y, originX, originY, 0);
          const sortKey = (x + y) * 10 + (tileVal - 1) * 0.5;

          drawables.push({
            sortKey,
            draw: () => {
              renderer.drawSeamlessBlock(ctx, baseIso.x, baseIso.y, tileVal, false);
            },
          });
        }
      }

      // 2. Switches with glowing gems on 3D elevation
      for (const sw of switchesRef.current) {
        const swElev = getElevation(sw.x, sw.y);
        const iso = renderer.gridToIso(sw.x, sw.y, originX, originY, swElev);
        drawables.push({
          sortKey: (sw.x + sw.y) * 10 + 1.5,
          draw: () => {
            const hw = renderer.tileW / 2;
            const hh = renderer.tileH / 2;

            ctx.fillStyle = sw.isPressed ? '#1e293b' : '#334155';
            ctx.beginPath();
            ctx.ellipse(iso.x, iso.y + hh, hw * 0.5, hh * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();

            const pulse = sw.isPressed ? 1.0 : Math.sin(animTime * 4) * 0.25 + 0.8;
            const colorMap = {
              green: '#22c55e',
              blue: '#38bdf8',
              red: '#ef4444',
              yellow: '#facc15',
              iron: '#94a3b8',
            };
            ctx.shadowColor = colorMap[sw.color] || '#38bdf8';
            ctx.shadowBlur = sw.isPressed ? 14 : 7;
            ctx.fillStyle = colorMap[sw.color] || '#38bdf8';
            ctx.beginPath();
            ctx.arc(iso.x, iso.y + hh - (sw.isPressed ? 1 : 4), 6 * pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          },
        });
      }

      // 3. Gates on 3D elevation
      for (const gt of gatesRef.current) {
        const gtElev = getElevation(gt.x, gt.y);
        const iso = renderer.gridToIso(gt.x, gt.y, originX, originY, gtElev);
        drawables.push({
          sortKey: (gt.x + gt.y) * 10 + 3,
          draw: () => {
            if (gt.isOpen) return;
            renderer.drawGate(ctx, iso.x, iso.y, gt.color);
          },
        });
      }

      // 4. Wooden Crates on 3D elevation
      for (const crate of cratesRef.current) {
        const cElev = getElevation(crate.x, crate.y);
        const iso = renderer.gridToIso(crate.x, crate.y, originX, originY, cElev);
        drawables.push({
          sortKey: (crate.x + crate.y) * 10 + 4,
          draw: () => {
            renderer.drawWoodenCrate(ctx, iso.x, iso.y);
          },
        });
      }

      // 5. Animated Waving Finish Flag on 3D elevation
      const finishElev = getElevation(level.finish.x, level.finish.y);
      const flagIso = renderer.gridToIso(
        level.finish.x,
        level.finish.y,
        originX,
        originY,
        finishElev
      );
      drawables.push({
        sortKey: (level.finish.x + level.finish.y) * 10 + 2.5,
        draw: () => {
          renderer.drawAnimatedFlag(ctx, flagIso, animTime);
        },
      });

      // 6. Animated Enemies on 3D elevation
      for (const enemy of enemiesRef.current) {
        if (!enemy.alive) continue;
        const eElev = getElevation(enemy.x, enemy.y);
        const enemyIso = renderer.gridToIso(enemy.x, enemy.y, originX, originY, eElev);
        drawables.push({
          sortKey: (enemy.x + enemy.y) * 10 + 5,
          draw: () => {
            renderer.drawEnemy(ctx, enemyIso.x, enemyIso.y, enemy.type, animTime);
          },
        });
      }

      // 7. Clockwise 4-direction indicator around Kodo
      const now = performance.now();
      const jumpElapsed = now - jumpStartRef.current;
      const isMidHop = jumpElapsed < 140;
      if (!isMidHop && isJumpingRef.current) {
        isJumpingRef.current = false;
      }

      const activeDir = renderer.updateDirection(dt, isMidHop);
      currentClockwiseDirRef.current = activeDir;

      const jumpProg = isMidHop ? Math.min(1.0, jumpElapsed / 140) : 1.0;
      const pPos = playerPosRef.current;
      const jFrom = jumpFromRef.current;
      const jTo = jumpToRef.current;

      const curX = isMidHop ? jFrom.x + (jTo.x - jFrom.x) * jumpProg : pPos.x;
      const curY = isMidHop ? jFrom.y + (jTo.y - jFrom.y) * jumpProg : pPos.y;

      const fromElev = getElevation(jFrom.x, jFrom.y);
      const toElev = getElevation(jTo.x, jTo.y);
      const curElev = isMidHop
        ? fromElev + (toElev - fromElev) * jumpProg
        : getElevation(pPos.x, pPos.y);

      const curPlayerIso = renderer.gridToIso(curX, curY, originX, originY, curElev);

      const { dx, dy } = getDirectionDelta(activeDir);
      const nextTileX = pPos.x + dx;
      const nextTileY = pPos.y + dy;
      const nextTileElev = isGroundCell(nextTileX, nextTileY)
        ? getElevation(nextTileX, nextTileY)
        : getElevation(pPos.x, pPos.y);
      const elevDiff = nextTileElev - getElevation(pPos.x, pPos.y);

      // 8. 100% Transparent Vector Kodo Bird with 3D jump arc
      const jumpArc = isMidHop ? Math.sin(jumpProg * Math.PI) * 26 : 0;

      drawables.push({
        sortKey: (curX + curY) * 10 + 6,
        draw: () => {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
          ctx.beginPath();
          const shadowSize = Math.max(6, 18 - jumpArc * 0.35);
          ctx.ellipse(
            curPlayerIso.x,
            curPlayerIso.y + renderer.tileH / 2 + 2,
            shadowSize,
            shadowSize * 0.5,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();

          renderer.drawKodoBird(
            ctx,
            curPlayerIso.x,
            curPlayerIso.y,
            facingRef.current,
            isMidHop,
            jumpArc,
            animTime,
            playerColor
          );
        },
      });

      drawables.sort((a, b) => a.sortKey - b.sortKey);
      for (const d of drawables) d.draw();

      // Keep the next-move indicator in a top overlay pass above tall terrain and actors.
      renderer.drawDirectionalIndicator(
        ctx,
        renderer.gridToIso(pPos.x, pPos.y, originX, originY, getElevation(pPos.x, pPos.y)),
        activeDir,
        animTime,
        elevDiff
      );

      renderer.renderParticles(ctx);

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [level, getElevation, isGroundCell]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        width={720}
        height={860}
        onPointerDown={handlePointerDown}
        className="w-full h-full max-w-lg object-contain cursor-pointer select-none touch-none"
      />
    </div>
  );
};
