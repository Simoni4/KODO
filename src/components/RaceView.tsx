import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Point, BotRacer } from '../game/types';
import { generateFairRaceArena, RaceArena } from '../game/raceGenerator';
import { bfsShortestPath } from '../game/pathfinding';
import { getDirectionDelta } from '../game/puzzleLogic';
import { IsometricRenderer } from '../game/isometricRenderer';
import { KodoAudioManager } from '../game/audio';

interface RaceViewProps {
  isPaused?: boolean;
  playerName?: string;
  playerColor?: string;
  onWin: (place: number, timeSeconds: number, winnerName: string) => void;
  onRankChange?: (rank: number) => void;
}

export const RaceView: React.FC<RaceViewProps> = ({
  isPaused = false,
  playerName = 'Player',
  playerColor = '#0284c7',
  onWin,
  onRankChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<IsometricRenderer>(new IsometricRenderer());

  const initialArenaRef = useRef<RaceArena>(generateFairRaceArena(18));
  const [arena, setArena] = useState<RaceArena>(() => initialArenaRef.current);
  const [playerPos, setPlayerPos] = useState<Point>(() => initialArenaRef.current.spawns[0]);
  const [playerFacing, setPlayerFacing] = useState<'left' | 'right' | 'front'>('front');

  const createInitialBots = (ar: RaceArena): BotRacer[] => [
    {
      id: 'bot1',
      name: 'Frosty',
      color: '#ef4444',
      avatar: 'imp',
      x: ar.spawns[1].x,
      y: ar.spawns[1].y,
      spawn: ar.spawns[1],
      personality: 'aggressive',
      alive: true,
      score: 0,
    },
    {
      id: 'bot2',
      name: 'Blizzard',
      color: '#a855f7',
      avatar: 'ghost',
      x: ar.spawns[2].x,
      y: ar.spawns[2].y,
      spawn: ar.spawns[2],
      personality: 'tricky',
      alive: true,
      score: 0,
    },
    {
      id: 'bot3',
      name: 'Pipsqueak',
      color: '#eab308',
      avatar: 'chick',
      x: ar.spawns[3].x,
      y: ar.spawns[3].y,
      spawn: ar.spawns[3],
      personality: 'cautious',
      alive: true,
      score: 0,
    },
  ];

  const [bots, setBots] = useState<BotRacer[]>(() => createInitialBots(initialArenaRef.current));
  const [raceActive, setRaceActive] = useState<boolean>(true);

  // Synchronous refs for instant jump series (серія стрибків) & stable 60fps loop
  const arenaRef = useRef<RaceArena>(arena);
  const playerPosRef = useRef<Point>(playerPos);
  const botsRef = useRef<BotRacer[]>(bots);
  const raceActiveRef = useRef<boolean>(true);
  const isPausedRef = useRef<boolean>(isPaused);
  const playerFacingRef = useRef<'left' | 'right' | 'front'>('front');

  const lastHopTimeRef = useRef<number>(0);
  const currentClockwiseDirRef = useRef<'up' | 'right' | 'down' | 'left'>('up');
  const lastTimeRef = useRef<number>(performance.now());
  const globalTimeRef = useRef<number>(0);
  const botTimerRef = useRef<any>(null);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    const newArena = generateFairRaceArena(18);
    const freshBots = createInitialBots(newArena);
    arenaRef.current = newArena;
    playerPosRef.current = newArena.spawns[0];
    botsRef.current = freshBots;
    raceActiveRef.current = true;
    setArena(newArena);
    setPlayerPos(newArena.spawns[0]);
    setBots(freshBots);
    setRaceActive(true);
  }, []);

  const isCellWalkableSync = useCallback((x: number, y: number) => {
    const curArena = arenaRef.current;
    if (x < 0 || x >= curArena.size || y < 0 || y >= curArena.size) return false;
    return curArena.grid[y][x] > 0;
  }, []);

  const canStepBetweenSync = useCallback((fromX: number, fromY: number, toX: number, toY: number) => {
    const curArena = arenaRef.current;
    if (toX < 0 || toX >= curArena.size || toY < 0 || toY >= curArena.size) return false;
    const fromVal = curArena.grid[fromY]?.[fromX] || 0;
    const toVal = curArena.grid[toY]?.[toX] || 0;
    if (fromVal <= 0 || toVal <= 0) return false;
    // Allow moving on flat blocks or jumping 1 block up (+1) or 1 block down (-1)
    return Math.abs(toVal - fromVal) <= 1;
  }, []);

  const handlePlayerMove = useCallback(
    (dir: 'up' | 'down' | 'left' | 'right') => {
      if (!raceActiveRef.current || isPausedRef.current) return;

      const now = performance.now();
      if (now - lastHopTimeRef.current < 45) return;
      lastHopTimeRef.current = now;

      // Lock direction during hop + 0.2s after hop so player can chain a jump series in the same direction!
      rendererRef.current.notifyPlayerHop(dir);
      currentClockwiseDirRef.current = dir;

      const { dx, dy } = getDirectionDelta(dir);
      const nextFacing = dir === 'left' || dir === 'up' ? 'left' : 'right';
      playerFacingRef.current = nextFacing;
      setPlayerFacing(nextFacing);

      const curPos = playerPosRef.current;
      const targetX = curPos.x + dx;
      const targetY = curPos.y + dy;

      // Strictly block falling off the map or jumping >1 block cliff in AI Race mode
      if (!canStepBetweenSync(curPos.x, curPos.y, targetX, targetY)) return;

      KodoAudioManager.playHop();

      const botOnTarget = botsRef.current.find(
        (b) => b.alive && b.x === targetX && b.y === targetY
      );
      if (botOnTarget) {
        const pushedX = botOnTarget.x + dx;
        const pushedY = botOnTarget.y + dy;
        const destinationOccupied = botsRef.current.some(
          (other) =>
            other.alive &&
            other.id !== botOnTarget.id &&
            other.x === pushedX &&
            other.y === pushedY
        );

        const pushedTileExists = isCellWalkableSync(pushedX, pushedY);

        // A void push resets the racer to its own spawn, matching the Unity AI Race rules.
        // A tall cliff or another racer blocks the push instead of causing a teleport.
        if (
          (pushedTileExists &&
            !canStepBetweenSync(botOnTarget.x, botOnTarget.y, pushedX, pushedY)) ||
          destinationOccupied
        ) {
          return;
        }
      }

      const nextBots = botsRef.current.map((b) => {
        if (b.alive && b.x === targetX && b.y === targetY) {
          const pushedX = b.x + dx;
          const pushedY = b.y + dy;
          KodoAudioManager.playPush();
          if (!isCellWalkableSync(pushedX, pushedY)) {
            return { ...b, x: b.spawn.x, y: b.spawn.y };
          }
          return { ...b, x: pushedX, y: pushedY };
        }
        return b;
      });

      botsRef.current = nextBots;
      setBots(nextBots);

      const nextPos = { x: targetX, y: targetY };
      playerPosRef.current = nextPos;
      setPlayerPos(nextPos);

      const curArena = arenaRef.current;
      const canvas = canvasRef.current;
      const { originX, originY } = rendererRef.current.configureGridMetrics(
        canvas?.width || 720,
        canvas?.height || 860,
        curArena.size,
        curArena.size
      );
      const targetElev = Math.max(0, curArena.grid[targetY][targetX] - 1);
      const iso = rendererRef.current.gridToIso(targetX, targetY, originX, originY, targetElev);
      rendererRef.current.addDustPuff(iso.x, iso.y + 14);

      if (targetX === curArena.finish.x && targetY === curArena.finish.y) {
        raceActiveRef.current = false;
        setRaceActive(false);
        KodoAudioManager.playVictory();
        rendererRef.current.addVictoryStars(iso.x, iso.y - 15);
        setTimeout(() => onWin(1, 0, 'Kodo'), 100);
      }
    },
    [canStepBetweenSync, onWin]
  );

  useEffect(() => {
    (window as any).__KODO_MOVE__ = handlePlayerMove;
    return () => {
      delete (window as any).__KODO_MOVE__;
    };
  }, [handlePlayerMove]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        handlePlayerMove('up');
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        handlePlayerMove('down');
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        handlePlayerMove('left');
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        handlePlayerMove('right');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayerMove]);

  // One-Tap Screen Control: Strictly hops in the active clockwise arrow direction!
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!raceActiveRef.current || isPausedRef.current) return;
    handlePlayerMove(currentClockwiseDirRef.current);
  };

  // AI Bots Loop
  useEffect(() => {
    if (!raceActive || isPaused) return;

    botTimerRef.current = setInterval(() => {
      const prevBots = botsRef.current;
      const curArena = arenaRef.current;
      let nextPlayerPos = playerPosRef.current;

      const updated = prevBots.map((bot) => {
        if (!bot.alive) return bot;

        // Personalities change only shortest-route tie-breaking, never movement speed.
        const directionOrder =
          bot.personality === 'aggressive'
            ? [{ x: -1, y: 0 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }]
            : bot.personality === 'tricky'
              ? [{ x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }]
              : [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: -1 }];

        // Frosty becomes an active rival: when close, it breaks from the finish
        // route to pressure Kodo and attempt a legal shove. Other bots keep racing.
        const playerDistance = Math.abs(bot.x - nextPlayerPos.x) + Math.abs(bot.y - nextPlayerPos.y);
        const botTarget =
          bot.personality === 'aggressive' && playerDistance <= 4
            ? nextPlayerPos
            : curArena.finish;

        const path = bfsShortestPath(
          { x: bot.x, y: bot.y },
          botTarget,
          isCellWalkableSync,
          curArena.size,
          curArena.size,
          (fromX, fromY, toX, toY) =>
            canStepBetweenSync(fromX, fromY, toX, toY),
          directionOrder
        );

        if (!path || path.length === 0) return bot;

        const nextStep = path[0];
        if (!canStepBetweenSync(bot.x, bot.y, nextStep.x, nextStep.y)) {
          return bot;
        }

        const anotherBotOnStep = prevBots.some(
          (other) =>
            other.alive &&
            other.id !== bot.id &&
            other.x === nextStep.x &&
            other.y === nextStep.y
        );
        if (anotherBotOnStep) return bot;

        if (nextStep.x === nextPlayerPos.x && nextStep.y === nextPlayerPos.y) {
          const pushDx = nextStep.x - bot.x;
          const pushDy = nextStep.y - bot.y;
          const pushedPX = nextPlayerPos.x + pushDx;
          const pushedPY = nextPlayerPos.y + pushDy;

          const pushedDestinationOccupied = prevBots.some(
            (other) =>
              other.alive &&
              other.id !== bot.id &&
              other.x === pushedPX &&
              other.y === pushedPY
          );

          // If the player cannot legally be pushed, or another bot occupies the landing tile,
          // the bot waits instead of swapping positions or stacking contestants.
          if (
            !canStepBetweenSync(nextPlayerPos.x, nextPlayerPos.y, pushedPX, pushedPY) ||
            pushedDestinationOccupied
          ) {
            return bot;
          }

          KodoAudioManager.playPush();
          nextPlayerPos = { x: pushedPX, y: pushedPY };
        }

        return { ...bot, x: nextStep.x, y: nextStep.y };
      });

      botsRef.current = updated;
      setBots(updated);

      if (
        nextPlayerPos.x !== playerPosRef.current.x ||
        nextPlayerPos.y !== playerPosRef.current.y
      ) {
        playerPosRef.current = nextPlayerPos;
        setPlayerPos(nextPlayerPos);
      }
    }, 850);

    return () => {
      if (botTimerRef.current) clearInterval(botTimerRef.current);
    };
  }, [raceActive, isPaused, isCellWalkableSync, canStepBetweenSync]);

  // Race Finish Winner Detection
  useEffect(() => {
    if (!raceActive) return;

    if (playerPos.x === arena.finish.x && playerPos.y === arena.finish.y) {
      raceActiveRef.current = false;
      setRaceActive(false);
      KodoAudioManager.playVictory();
      setTimeout(() => onWin(1, 0, 'Kodo'), 50);
      return;
    }

    const winningBot = bots.find((b) => b.x === arena.finish.x && b.y === arena.finish.y);
    if (winningBot) {
      raceActiveRef.current = false;
      setRaceActive(false);
      KodoAudioManager.playDefeat();
      setTimeout(() => onWin(2, 0, winningBot.name), 50);
    }
  }, [playerPos, bots, arena.finish, raceActive, onWin]);

  // Rank calculation
  useEffect(() => {
    // Rank by the actual legal route, not Manhattan distance through holes or cliffs.
    const distToFinish = (position: Point) => {
      const path = bfsShortestPath(
        position,
        arena.finish,
        isCellWalkableSync,
        arena.size,
        arena.size,
        (fromX, fromY, toX, toY) =>
          canStepBetweenSync(fromX, fromY, toX, toY)
      );
      return path ? path.length : Number.POSITIVE_INFINITY;
    };

    const playerDist = distToFinish(playerPos);
    let rank = 1;
    for (const b of bots) {
      if (distToFinish({ x: b.x, y: b.y }) < playerDist) {
        rank++;
      }
    }
    onRankChange?.(rank);
  }, [playerPos, bots, arena.finish, arena.size, onRankChange, isCellWalkableSync, canStepBetweenSync]);

  // Stable 60fps Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let active = true;
    let animId: number;

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

      const curArena = arenaRef.current;
      const curPlayerPos = playerPosRef.current;
      const curBots = botsRef.current;

      const { originX, originY } = renderer.configureGridMetrics(
        width,
        height,
        curArena.size,
        curArena.size
      );

      const playerElev = Math.max(0, (curArena.grid[curPlayerPos.y]?.[curPlayerPos.x] || 1) - 1);
      const playerScreen = renderer.gridToIso(
        curPlayerPos.x,
        curPlayerPos.y,
        originX,
        originY,
        playerElev
      );

      interface Drawable {
        sortKey: number;
        draw: () => void;
      }
      const drawables: Drawable[] = [];

      // 1. Seamless 3D Arena Blocks
      for (let y = 0; y < curArena.size; y++) {
        for (let x = 0; x < curArena.size; x++) {
          const tileVal = curArena.grid[y][x];
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

      // 2. Animated Center Flag on Elevated Podium
      const finishElev = Math.max(
        0,
        (curArena.grid[curArena.finish.y]?.[curArena.finish.x] || 1) - 1
      );
      const flagIso = renderer.gridToIso(
        curArena.finish.x,
        curArena.finish.y,
        originX,
        originY,
        finishElev
      );
      drawables.push({
        sortKey: (curArena.finish.x + curArena.finish.y) * 10 + 3,
        draw: () => {
          renderer.drawAnimatedFlag(ctx, flagIso, animTime);
        },
      });

      // 3. AI Bots
      for (const bot of curBots) {
        const botElev = Math.max(0, (curArena.grid[bot.y]?.[bot.x] || 1) - 1);
        const botIso = renderer.gridToIso(bot.x, bot.y, originX, originY, botElev);
        drawables.push({
          sortKey: (bot.x + bot.y) * 10 + 5,
          draw: () => {
            const botBob = Math.sin(animTime * 3.5 + bot.x) * 2;

            ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
            ctx.beginPath();
            ctx.ellipse(botIso.x, botIso.y + renderer.tileH / 2 + 2, 16, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            renderer.drawKodoBird(
              ctx,
              botIso.x,
              botIso.y,
              'front',
              false,
              0,
              animTime,
              bot.color
            );

            ctx.fillStyle = bot.color;
            ctx.beginPath();
            ctx.roundRect(botIso.x - 22, botIso.y - 42 + botBob, 44, 15, 5);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(bot.name, botIso.x, botIso.y - 31 + botBob);
          },
        });
      }

      // 4. Clockwise Stepping Direction Arrow around Kodo
      const isMidHop = performance.now() - lastHopTimeRef.current < 150;
      const activeDir = renderer.updateDirection(dt, isMidHop);
      currentClockwiseDirRef.current = activeDir;

      const { dx, dy } = getDirectionDelta(activeDir);
      const targetVal = curArena.grid[curPlayerPos.y + dy]?.[curPlayerPos.x + dx] || 0;
      const targetElev = targetVal > 0 ? targetVal - 1 : playerElev;
      const elevDiff = targetElev - playerElev;

      // 5. 100% Transparent Vector Kodo Bird
      drawables.push({
        sortKey: (curPlayerPos.x + curPlayerPos.y) * 10 + 6,
        draw: () => {
          const idleBob = Math.sin(animTime * 3) * 2;

          ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
          ctx.beginPath();
          ctx.ellipse(
            playerScreen.x,
            playerScreen.y + renderer.tileH / 2 + 2,
            16,
            8,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();

          renderer.drawKodoBird(
            ctx,
            playerScreen.x,
            playerScreen.y,
            playerFacingRef.current,
            false,
            0,
            animTime,
            playerColor
          );

          ctx.font = 'bold 9px sans-serif';
          const badgeWidth = Math.max(42, Math.min(104, ctx.measureText(playerName).width + 16));
          ctx.fillStyle = playerColor;
          ctx.beginPath();
          ctx.roundRect(playerScreen.x - badgeWidth / 2, playerScreen.y - 42 + idleBob, badgeWidth, 14, 5);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText(playerName, playerScreen.x, playerScreen.y - 31 + idleBob);
        },
      });

      drawables.sort((a, b) => a.sortKey - b.sortKey);
      for (const d of drawables) d.draw();

      // Draw the direction cue in a final overlay pass so tall foreground blocks
      // and characters can never obscure the player's next move.
      renderer.drawDirectionalIndicator(ctx, playerScreen, activeDir, animTime, elevDiff);

      renderer.renderParticles(ctx);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      active = false;
      cancelAnimationFrame(animId);
    };
  }, []);

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
