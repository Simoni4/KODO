import React, { useEffect, useRef, useState, useCallback } from 'react';
import { initSurvivalArena, SurvivalEntity, SurvivalTileState } from '../game/survivalEngine';
import { getDirectionDelta } from '../game/puzzleLogic';
import { IsometricRenderer } from '../game/isometricRenderer';
import { KodoAudioManager } from '../game/audio';

interface SurvivalViewProps {
  isPaused?: boolean;
  onWin: (survivalTimeSeconds: number) => void;
  onLose: (reason: string) => void;
  onAliveCountChange?: (count: number) => void;
}

export const SurvivalView: React.FC<SurvivalViewProps> = ({
  isPaused = false,
  onWin,
  onLose,
  onAliveCountChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<IsometricRenderer>(new IsometricRenderer());

  const arenaSize = 18;
  const initialArenaRef = useRef(initSurvivalArena(arenaSize));
  const [tiles, setTiles] = useState<Map<string, SurvivalTileState>>(
    () => initialArenaRef.current.tiles
  );
  const [players, setPlayers] = useState<SurvivalEntity[]>(
    () => initialArenaRef.current.players
  );
  const [isActive, setIsActive] = useState<boolean>(true);
  const [facing, setFacing] = useState<'left' | 'right' | 'front'>('front');

  // Synchronous refs for instant, lag-free jump series (серія стрибків) & stable 60fps loop
  const tilesRef = useRef<Map<string, SurvivalTileState>>(tiles);
  const playersRef = useRef<SurvivalEntity[]>(players);
  const isActiveRef = useRef<boolean>(true);
  const isPausedRef = useRef<boolean>(isPaused);
  const facingRef = useRef<'left' | 'right' | 'front'>('front');

  const currentClockwiseDirRef = useRef<'up' | 'right' | 'down' | 'left'>('up');
  const lastHopTimeRef = useRef<number>(0);

  const crumbleTimerRef = useRef<any>(null);
  const botMoveTimerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(Date.now());
  const lastTimeRef = useRef<number>(performance.now());
  const globalTimeRef = useRef<number>(0);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    const fresh = initSurvivalArena(arenaSize);
    tilesRef.current = fresh.tiles;
    playersRef.current = fresh.players;
    isActiveRef.current = true;
    setTiles(fresh.tiles);
    setPlayers(fresh.players);
    setIsActive(true);
    startTimeRef.current = Date.now();
  }, []);

  const isCellStandingSync = useCallback((x: number, y: number) => {
    if (x < 0 || x >= arenaSize || y < 0 || y >= arenaSize) return false;
    const tile = tilesRef.current.get(`${x},${y}`);
    return tile !== undefined && tile.state !== 'crumbled';
  }, []);

  const getTileElevationSync = useCallback((x: number, y: number): number => {
    const tile = tilesRef.current.get(`${x},${y}`);
    return tile ? tile.elevation || 0 : 0;
  }, []);

  const handlePlayerMove = useCallback(
    (dir: 'up' | 'down' | 'left' | 'right') => {
      if (!isActiveRef.current || isPausedRef.current) return;

      const now = performance.now();
      if (now - lastHopTimeRef.current < 45) return;
      lastHopTimeRef.current = now;

      // Lock direction during hop + 0.2s after hop so player can chain a jump series in the same direction!
      rendererRef.current.notifyPlayerHop(dir);
      currentClockwiseDirRef.current = dir;

      const currentPlayers = playersRef.current;
      const player = currentPlayers.find((p) => p.isPlayer && p.alive);
      if (!player) return;

      const { dx, dy } = getDirectionDelta(dir);
      const nextFacing = dir === 'left' || dir === 'up' ? 'left' : 'right';
      facingRef.current = nextFacing;
      setFacing(nextFacing);

      const targetX = player.x + dx;
      const targetY = player.y + dy;

      KodoAudioManager.playHop();

      // In Survival mode, stepping into the void / crumbled ice causes Kodo to fall into the abyss!
      if (!isCellStandingSync(targetX, targetY)) {
        KodoAudioManager.playDefeat();
        isActiveRef.current = false;
        setIsActive(false);
        const fallen = currentPlayers.map((p) =>
          p.isPlayer ? { ...p, x: targetX, y: targetY, alive: false } : p
        );
        playersRef.current = fallen;
        setPlayers(fallen);
        setTimeout(() => onLose('You fell into the icy abyss!'), 50);
        return;
      }

      // Check 3D elevation difference (can climb +1 block up or hop -1 block down)
      const curElev = getTileElevationSync(player.x, player.y);
      const targetElev = getTileElevationSync(targetX, targetY);
      if (Math.abs(targetElev - curElev) > 1) {
        return;
      }

      const botOnTarget = currentPlayers.find(
        (p) => !p.isPlayer && p.alive && p.x === targetX && p.y === targetY
      );
      if (botOnTarget) {
        const shovedX = botOnTarget.x + dx;
        const shovedY = botOnTarget.y + dy;
        // A bot cannot be pushed onto a walkable platform that is more than one level away.
        const anotherBotAtShoveDestination = currentPlayers.some(
          (other) =>
            other.alive &&
            !other.isPlayer &&
            other.id !== botOnTarget.id &&
            other.x === shovedX &&
            other.y === shovedY
        );
        if (
          anotherBotAtShoveDestination ||
          (isCellStandingSync(shovedX, shovedY) &&
            Math.abs(getTileElevationSync(shovedX, shovedY) - targetElev) > 1)
        ) {
          return;
        }
      }

      const updatedPlayers = currentPlayers.map((p) => {
        if (!p.isPlayer && p.alive && p.x === targetX && p.y === targetY) {
          const shovedX = p.x + dx;
          const shovedY = p.y + dy;
          KodoAudioManager.playPush();

          if (!isCellStandingSync(shovedX, shovedY)) {
            KodoAudioManager.playDefeat();
            return { ...p, x: shovedX, y: shovedY, alive: false };
          }
          return { ...p, x: shovedX, y: shovedY };
        }
        if (p.isPlayer) {
          return { ...p, x: targetX, y: targetY };
        }
        return p;
      });

      // Update ref synchronously so rapid taps in a jump series immediately chain from the new tile!
      playersRef.current = updatedPlayers;
      setPlayers(updatedPlayers);

      const canvas = canvasRef.current;
      const { originX, originY } = rendererRef.current.configureGridMetrics(
        canvas?.width || 720,
        canvas?.height || 860,
        arenaSize,
        arenaSize
      );
      const iso = rendererRef.current.gridToIso(targetX, targetY, originX, originY, targetElev);
      rendererRef.current.addDustPuff(iso.x, iso.y + 14);
    },
    [isCellStandingSync, getTileElevationSync, onLose]
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
  // Supports rapid jump series (серія стрибків) without any accidental adjacent-tile hijacking.
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isActiveRef.current || isPausedRef.current) return;
    handlePlayerMove(currentClockwiseDirRef.current);
  };

  // Crumbling Tiles Loop
  useEffect(() => {
    if (!isActive || isPaused) return;

    crumbleTimerRef.current = setInterval(() => {
      setTiles((prevTiles) => {
        const next = new Map(prevTiles);

        for (const [key, t] of next.entries()) {
          if (t.state === 'warning') {
            next.set(key, { ...t, state: 'crumbled' });
            KodoAudioManager.playCrumble();
          }
        }

        const stableKeys = Array.from(next.keys()).filter((k) => {
          const tile = next.get(k);
          // Keep the tall perimeter fence intact; only the playable arena floor crumbles.
          return tile?.state === 'stable' && (tile.elevation || 0) < 2 &&
            !(tile.x === 2 || tile.x === arenaSize - 3 || tile.y === 2);
        });
        if (stableKeys.length > 4) {
          for (let i = 0; i < 2; i++) {
            const randIdx = Math.floor(Math.random() * stableKeys.length);
            const chosenKey = stableKeys[randIdx];
            const tile = next.get(chosenKey);
            if (tile && tile.state === 'stable') {
              next.set(chosenKey, { ...tile, state: 'warning' });
            }
          }
        }

        tilesRef.current = next;
        return next;
      });
    }, 1050);

    return () => {
      if (crumbleTimerRef.current) clearInterval(crumbleTimerRef.current);
    };
  }, [isActive, isPaused]);

  // Check if any alive contestant is standing on a crumbled tile
  useEffect(() => {
    if (!isActive) return;
    const someoneOnCrumbled = players.some(
      (p) => p.alive && !isCellStandingSync(p.x, p.y)
    );
    if (someoneOnCrumbled) {
      setPlayers((prev) => {
        const next = prev.map((p) => {
          if (p.alive && !isCellStandingSync(p.x, p.y)) {
            return { ...p, alive: false };
          }
          return p;
        });
        playersRef.current = next;
        return next;
      });
    }
  }, [tiles, players, isActive, isCellStandingSync]);

  // AI Bots Loop (paced at 850ms so player can outmaneuver them)
  useEffect(() => {
    if (!isActive || isPaused) return;

    botMoveTimerRef.current = setInterval(() => {
      setPlayers((prev) => {
        const nextPlayers = [...prev];

        for (let i = 0; i < nextPlayers.length; i++) {
          const bot = nextPlayers[i];
          if (bot.isPlayer || !bot.alive) continue;

          const botElev = getTileElevationSync(bot.x, bot.y);
          const legalNeighbors = [
            { x: bot.x, y: bot.y - 1 },
            { x: bot.x, y: bot.y + 1 },
            { x: bot.x - 1, y: bot.y },
            { x: bot.x + 1, y: bot.y },
          ].filter(
            (n) =>
              isCellStandingSync(n.x, n.y) &&
              Math.abs(getTileElevationSync(n.x, n.y) - botElev) <= 1
          );

          if (legalNeighbors.length === 0) {
            nextPlayers[i] = { ...bot, alive: false };
            continue;
          }

          // Contestants cannot stack on one tile; if every legal tile is occupied, wait.
          const neighbors = legalNeighbors.filter(
            (n) =>
              !nextPlayers.some(
                (other) =>
                  other.alive &&
                  !other.isPlayer &&
                  other.id !== bot.id &&
                  other.x === n.x &&
                  other.y === n.y
              )
          );
          if (neighbors.length === 0) continue;

          const stableNeighbors = neighbors.filter((n) => {
            const t = tilesRef.current.get(`${n.x},${n.y}`);
            return t?.state === 'stable';
          });

          const candidates = stableNeighbors.length > 0 ? stableNeighbors : neighbors;
          const chosen = candidates[Math.floor(Math.random() * candidates.length)];

          const playerIdx = nextPlayers.findIndex((p) => p.isPlayer && p.alive);
          if (
            playerIdx !== -1 &&
            chosen.x === nextPlayers[playerIdx].x &&
            chosen.y === nextPlayers[playerIdx].y
          ) {
            const pPushDx = chosen.x - bot.x;
            const pPushDy = chosen.y - bot.y;
            const pNextX = nextPlayers[playerIdx].x + pPushDx;
            const pNextY = nextPlayers[playerIdx].y + pPushDy;

            const player = nextPlayers[playerIdx];
            const pushTargetIsWalkable = isCellStandingSync(pNextX, pNextY);
            const pushHeightIsReachable =
              Math.abs(
                getTileElevationSync(pNextX, pNextY) -
                getTileElevationSync(player.x, player.y)
              ) <= 1;

            // A bot may knock Kodo into the abyss, but cannot teleport it across a tall cliff.
            if (pushTargetIsWalkable && !pushHeightIsReachable) {
              continue;
            }

            KodoAudioManager.playPush();
            nextPlayers[playerIdx] = {
              ...player,
              x: pNextX,
              y: pNextY,
              alive: pushTargetIsWalkable,
            };
          }

          nextPlayers[i] = { ...bot, x: chosen.x, y: chosen.y };
        }

        playersRef.current = nextPlayers;
        return nextPlayers;
      });
    }, 850);

    return () => {
      if (botMoveTimerRef.current) clearInterval(botMoveTimerRef.current);
    };
  }, [isActive, isPaused, isCellStandingSync, getTileElevationSync]);

  // Win / Defeat Outcome Check
  useEffect(() => {
    const aliveContestants = players.filter((p) => p.alive);
    onAliveCountChange?.(aliveContestants.length);

    if (!isActive) return;

    const humanPlayer = players.find((p) => p.isPlayer);
    if (humanPlayer && !humanPlayer.alive) {
      isActiveRef.current = false;
      setIsActive(false);
      KodoAudioManager.playDefeat();
      setTimeout(() => {
        onLose('You fell into the icy abyss!');
      }, 50);
      return;
    }

    if (aliveContestants.length <= 1) {
      isActiveRef.current = false;
      setIsActive(false);
      const survivedTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const winner = aliveContestants[0];

      if (winner && winner.isPlayer) {
        KodoAudioManager.playVictory();
        setTimeout(() => onWin(survivedTime), 100);
      } else {
        KodoAudioManager.playDefeat();
        setTimeout(() => {
          onLose(
            winner
              ? `${winner.name} is the last bird standing!`
              : 'All birds fell into the abyss!'
          );
        }, 100);
      }
    }
  }, [players, isActive, onAliveCountChange, onWin, onLose]);

  // Stable 60fps Render Loop (reads from synchronous refs so state updates never interrupt arrow timing)
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

      const { originX, originY } = renderer.configureGridMetrics(
        width,
        height,
        arenaSize,
        arenaSize
      );

      interface Drawable {
        sortKey: number;
        draw: () => void;
      }
      const drawables: Drawable[] = [];

      const currentTiles = tilesRef.current;
      const currentPlayers = playersRef.current;

      // 1. Seamless 3D Multi-Tier Blocks with warning vibration
      for (const t of currentTiles.values()) {
        if (t.state === 'crumbled') continue;

        const baseIso = renderer.gridToIso(t.x, t.y, originX, originY, 0);
        const tileType = (t.elevation || 0) + 1;
        const sortKey = (t.x + t.y) * 10 + (t.elevation || 0) * 0.5;
        const isWarning = t.state === 'warning';

        drawables.push({
          sortKey,
          draw: () => {
            const shake = isWarning ? Math.sin(animTime * 35) * 3 : 0;
            renderer.drawSeamlessBlock(ctx, baseIso.x + shake, baseIso.y, tileType, isWarning);
          },
        });
      }

      // 2. Characters (100% Vector Kodo Birds)
      let playerIndicator: { position: { x: number; y: number }; direction: 'up' | 'right' | 'down' | 'left'; elevationDiff: number } | null = null;
      for (const p of currentPlayers) {
        if (!p.alive) continue;
        const pElev = getTileElevationSync(p.x, p.y);
        const pIso = renderer.gridToIso(p.x, p.y, originX, originY, pElev);

        // Clockwise 4-direction indicator around active player (Holds during hop + 0.2s after hop, then steps every 0.5s)
        if (p.isPlayer) {
          const isMidHop = performance.now() - lastHopTimeRef.current < 150;
          const activeDir = renderer.updateDirection(dt, isMidHop);
          currentClockwiseDirRef.current = activeDir;

          const { dx, dy } = getDirectionDelta(activeDir);
          const targetTile = currentTiles.get(`${p.x + dx},${p.y + dy}`);
          const targetElev =
            targetTile && targetTile.state !== 'crumbled' ? targetTile.elevation || 0 : pElev;
          const elevDiff = targetElev - pElev;

          playerIndicator = { position: pIso, direction: activeDir, elevationDiff: elevDiff };
        }

        drawables.push({
          sortKey: (p.x + p.y) * 10 + 5,
          draw: () => {
            const idleBob = Math.sin(animTime * 3.5 + p.x) * 2;

            // Ground shadow
            ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
            ctx.beginPath();
            ctx.ellipse(pIso.x, pIso.y + renderer.tileH / 2 + 2, 16, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            // Vector Bird with animated wings & blinking eyes
            renderer.drawKodoBird(
              ctx,
              pIso.x,
              pIso.y,
              p.isPlayer ? facingRef.current : 'front',
              false,
              0,
              animTime,
              p.isPlayer ? undefined : p.color
            );

            // Name Badge
            ctx.fillStyle = p.isPlayer ? '#0284c7' : p.color;
            ctx.beginPath();
            ctx.roundRect(pIso.x - 24, pIso.y - 44 + idleBob, 48, 15, 6);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(p.name, pIso.x, pIso.y - 33 + idleBob);
          },
        });
      }

      drawables.sort((a, b) => a.sortKey - b.sortKey);
      for (const d of drawables) d.draw();

      // Render the active direction after the terrain so foreground blocks never hide it.
      if (playerIndicator) {
        renderer.drawDirectionalIndicator(
          ctx,
          playerIndicator.position,
          playerIndicator.direction,
          animTime,
          playerIndicator.elevationDiff
        );
      }

      renderer.renderParticles(ctx);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      active = false;
      cancelAnimationFrame(animId);
    };
  }, [getTileElevationSync]);

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
