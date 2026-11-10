import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SurvivalEntity, SurvivalTileState } from '../game/survivalEngine';
import { getDirectionDelta } from '../game/puzzleLogic';
import { IsometricRenderer } from '../game/isometricRenderer';
import { KodoAudioManager } from '../game/audio';

export interface ArenaPlacement {
  id: string;
  name: string;
  color: string;
  place: number;
}

interface ArenaViewProps {
  isPaused?: boolean;
  onComplete: (placements: ArenaPlacement[]) => void;
  onPlayerEliminated?: (place: number) => void;
}

const SIZE = 22;
const COLORS = ['#f97316', '#a855f7', '#22c55e', '#eab308', '#ec4899', '#06b6d4', '#ef4444'];

function createContestants(): SurvivalEntity[] {
  const starts = [
    [2, 2], [11, 2], [19, 2], [2, 11],
    [19, 11], [2, 19], [11, 19], [19, 19],
  ];
  const names = ['Kodo', 'Brr', 'Pip', 'Mochi', 'Frost', 'Kiwi', 'Nix', 'Bobo'];
  return starts.map(([x, y], i) => ({
    id: `arena-${i}`, name: names[i], x, y,
    isPlayer: i === 0, color: i === 0 ? '#0284c7' : COLORS[i - 1], alive: true,
  }));
}

export const ArenaView: React.FC<ArenaViewProps> = ({ isPaused = false, onComplete, onPlayerEliminated }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef(new IsometricRenderer());
  const [players, setPlayers] = useState<SurvivalEntity[]>(createContestants);
  const [playerPlace, setPlayerPlace] = useState<number | null>(null);
  const playersRef = useRef(players);
  const [tiles] = useState<Map<string, SurvivalTileState>>(() => {
    const map = new Map<string, SurvivalTileState>();
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      map.set(`${x},${y}`, { x, y, state: 'stable', elevation: 0 });
    }
    return map;
  });
  const tilesRef = useRef(tiles);
  const pausedRef = useRef(isPaused);
  const activeRef = useRef(true);
  const directionRef = useRef<'up' | 'right' | 'down' | 'left'>('up');
  const lastHopRef = useRef(0);
  const facingRef = useRef<'left' | 'right' | 'front'>('front');
  const placementsRef = useRef<ArenaPlacement[]>([]);
  const finishedRef = useRef(false);
  const lastTimeRef = useRef(performance.now());
  const animTimeRef = useRef(0);

  useEffect(() => { pausedRef.current = isPaused; }, [isPaused]);

  const eliminate = useCallback((entity: SurvivalEntity, current: SurvivalEntity[]) => {
    if (!entity.alive) return current;
    const aliveBefore = current.filter(p => p.alive).length;
    const place = aliveBefore;
    placementsRef.current.push({ id: entity.id, name: entity.name, color: entity.color, place });
    if (entity.isPlayer) { setPlayerPlace(place); onPlayerEliminated?.(place); }
    return current.map(p => p.id === entity.id ? { ...p, alive: false } : p);
  }, [onPlayerEliminated]);

  const movePlayer = useCallback((dir: 'up' | 'down' | 'left' | 'right') => {
    if (!activeRef.current || pausedRef.current) return;
    const now = performance.now();
    if (now - lastHopRef.current < 90) return;
    lastHopRef.current = now;
    directionRef.current = dir;
    rendererRef.current.notifyPlayerHop(dir);
    facingRef.current = dir === 'left' || dir === 'up' ? 'left' : 'right';
    const { dx, dy } = getDirectionDelta(dir);
    const current = playersRef.current;
    const human = current.find(p => p.isPlayer && p.alive);
    if (!human) return;
    const x = human.x + dx, y = human.y + dy;
    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
    let next = [...current];
    const victim = next.find(p => !p.isPlayer && p.alive && p.x === x && p.y === y);
    if (victim) {
      next = eliminate(victim, next);
      KodoAudioManager.playPush();
    }
    next = next.map(p => p.isPlayer ? { ...p, x, y } : p);
    playersRef.current = next;
    setPlayers(next);
    KodoAudioManager.playHop();
    const canvas = canvasRef.current;
    const { originX, originY } = rendererRef.current.configureGridMetrics(canvas?.width || 720, canvas?.height || 860, SIZE, SIZE);
    const iso = rendererRef.current.gridToIso(x, y, originX, originY, 0);
    rendererRef.current.addDustPuff(iso.x, iso.y + 14);
  }, [eliminate]);

  useEffect(() => {
    (window as any).__KODO_MOVE__ = movePlayer;
    const key = (e: KeyboardEvent) => {
      const map: Record<string, 'up' | 'right' | 'down' | 'left'> = {
        ArrowUp: 'up', KeyW: 'up', ArrowRight: 'right', KeyD: 'right',
        ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left',
      };
      const dir = map[e.code];
      if (dir) { e.preventDefault(); movePlayer(dir); }
    };
    window.addEventListener('keydown', key);
    return () => { delete (window as any).__KODO_MOVE__; window.removeEventListener('keydown', key); };
  }, [movePlayer]);

  useEffect(() => {
    if (isPaused) return;
    const timer = window.setInterval(() => {
      if (!activeRef.current || pausedRef.current) return;
      let next = [...playersRef.current];
      for (let i = 1; i < next.length; i++) {
        const bot = next[i];
        if (!bot.alive) continue;
        const targets = next.filter(p => p.alive && p.id !== bot.id);
        if (!targets.length) continue;
        const target = targets.sort((a,b) => Math.abs(a.x-bot.x)+Math.abs(a.y-bot.y) - (Math.abs(b.x-bot.x)+Math.abs(b.y-bot.y)))[0];
        const candidates = [{x:bot.x,y:bot.y-1},{x:bot.x+1,y:bot.y},{x:bot.x,y:bot.y+1},{x:bot.x-1,y:bot.y}]
          .filter(p => p.x >= 0 && p.y >= 0 && p.x < SIZE && p.y < SIZE);
        candidates.sort((a,b) => (Math.abs(a.x-target.x)+Math.abs(a.y-target.y)) - (Math.abs(b.x-target.x)+Math.abs(b.y-target.y)));
        const step = Math.random() < 0.22 ? candidates[Math.floor(Math.random()*candidates.length)] : candidates[0];
        const victim = next.find(p => p.alive && p.id !== bot.id && p.x === step.x && p.y === step.y);
        if (victim) {
          next = eliminate(victim, next);
          KodoAudioManager.playPush();
        }
        next = next.map(p => p.id === bot.id ? { ...p, x: step.x, y: step.y } : p);
      }
      playersRef.current = next;
      setPlayers(next);
    }, 760);
    return () => window.clearInterval(timer);
  }, [isPaused, eliminate]);

  useEffect(() => {
    const alive = players.filter(p => p.alive);
    if (alive.length > 1 || finishedRef.current) return;
    finishedRef.current = true;
    activeRef.current = false;
    const winner = alive[0];
    if (winner) placementsRef.current.push({ id: winner.id, name: winner.name, color: winner.color, place: 1 });
    const sorted = [...placementsRef.current].sort((a,b) => a.place-b.place);
    onComplete(sorted);
    if (winner?.isPlayer) KodoAudioManager.playVictory();
    else KodoAudioManager.playDefeat();
  }, [players, onComplete]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!activeRef.current || pausedRef.current) return;
    movePlayer(directionRef.current);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let raf = 0, running = true;
    const render = (time: number) => {
      if (!running) return;
      const dt = Math.min((time-lastTimeRef.current)/1000, 0.05);
      lastTimeRef.current = time;
      animTimeRef.current += dt;
      const renderer = rendererRef.current;
      renderer.updateParticles(dt);
      ctx.clearRect(0,0,canvas.width,canvas.height);
      renderer.renderSnowflakes(ctx,canvas.width,canvas.height);
      const {originX,originY} = renderer.configureGridMetrics(canvas.width,canvas.height,SIZE,SIZE);
      const drawables: {key:number;draw:()=>void}[] = [];
      for (const tile of tilesRef.current.values()) {
        const iso = renderer.gridToIso(tile.x,tile.y,originX,originY,0);
        drawables.push({key:(tile.x+tile.y)*10,draw:()=>renderer.drawSeamlessBlock(ctx,iso.x,iso.y,1,false)});
      }
      let indicator: {position:{x:number;y:number};direction:'up'|'right'|'down'|'left'}|null = null;
      for (const p of playersRef.current) {
        if (!p.alive) continue;
        const iso = renderer.gridToIso(p.x,p.y,originX,originY,0);
        if (p.isPlayer) {
          const dir = renderer.updateDirection(dt, performance.now()-lastHopRef.current < 150);
          directionRef.current = dir;
          indicator = {position:iso,direction:dir};
        }
        drawables.push({key:(p.x+p.y)*10+5,draw:()=>{
          ctx.fillStyle='rgba(15,23,42,.4)'; ctx.beginPath(); ctx.ellipse(iso.x,iso.y+renderer.tileH/2+2,16,8,0,0,Math.PI*2); ctx.fill();
          renderer.drawKodoBird(ctx,iso.x,iso.y,p.isPlayer?facingRef.current:'front',false,0,animTimeRef.current,p.isPlayer?undefined:p.color);
          ctx.fillStyle=p.isPlayer?'#0284c7':p.color; ctx.beginPath(); ctx.roundRect(iso.x-24,iso.y-44,48,15,6); ctx.fill();
          ctx.fillStyle='#fff'; ctx.font='bold 9px sans-serif'; ctx.textAlign='center'; ctx.fillText(p.name,iso.x,iso.y-33);
        }});
      }
      drawables.sort((a,b)=>a.key-b.key).forEach(d=>d.draw());
      if (indicator) renderer.drawDirectionalIndicator(ctx,indicator.position,indicator.direction,animTimeRef.current,0);
      renderer.renderParticles(ctx);
      raf=requestAnimationFrame(render);
    };
    raf=requestAnimationFrame(render);
    return ()=>{running=false;cancelAnimationFrame(raf);};
  }, []);

  return <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
    {playerPlace !== null && <div className="absolute top-20 z-20 rounded-2xl border border-rose-300/40 bg-slate-950/85 px-4 py-2 text-center shadow-xl pointer-events-none"><div className="text-xs font-bold uppercase tracking-wider text-rose-200">You were eaten</div><div className="text-xl font-black text-white">{playerPlace}{playerPlace === 1 ? 'st' : playerPlace === 2 ? 'nd' : playerPlace === 3 ? 'rd' : 'th'} place</div><div className="text-[10px] text-slate-300">Watching the final duel…</div></div>}
    <canvas ref={canvasRef} width={720} height={860} onPointerDown={handlePointerDown} className="w-full h-full max-w-lg object-contain cursor-pointer select-none touch-none" />
  </div>;
};

export const ArenaResultsModal: React.FC<{ placements: ArenaPlacement[]; onRetry: () => void; onMainMenu: () => void }> = ({ placements, onRetry, onMainMenu }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
    <div className="w-full max-w-sm rounded-3xl border-2 border-amber-400/50 bg-slate-900 p-5 text-center shadow-2xl">
      <div className="text-5xl mb-1">🏆</div>
      <h2 className="text-2xl font-black uppercase text-amber-300">1st Place</h2>
      <p className="text-sm text-slate-300 mb-4">{placements.find(p => p.place === 1)?.name || 'Winner'} wins the arena!</p>
      <div className="space-y-1.5 mb-5 text-left">
        {placements.map(p => <div key={p.id} className={`flex items-center justify-between rounded-xl px-3 py-2 ${p.place === 1 ? 'bg-amber-400/15 border border-amber-400/40' : 'bg-slate-800'}`}>
          <span className="flex items-center gap-2 text-sm font-bold text-white"><span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:p.color}} />{p.name}</span>
          <span className={`text-sm font-black ${p.place === 1 ? 'text-amber-300' : 'text-slate-300'}`}>{p.place}{p.place === 1 ? 'st' : p.place === 2 ? 'nd' : p.place === 3 ? 'rd' : 'th'}</span>
        </div>)}
      </div>
      <div className="flex gap-2"><button onClick={onRetry} className="flex-1 rounded-xl bg-violet-600 py-3 text-sm font-black uppercase text-white">Play Again</button><button onClick={onMainMenu} className="flex-1 rounded-xl bg-slate-700 py-3 text-sm font-black uppercase text-white">Main Menu</button></div>
    </div>
  </div>
);
