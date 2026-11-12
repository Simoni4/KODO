import React from 'react';
import { Settings, Play, Sparkles, Palette, Trophy } from 'lucide-react';
import { KodoHeroMascot } from './KodoHeroMascot';

interface TitleScreenProps {
  onPlay: () => void;
  onOpenCustomize: () => void;
  onOpenSettings: () => void;
}

export const MAIN_MENU_THEME = {
  id: 'aurora',
  name: 'Northern Lights Winter Biome',
  image: '/extracted/theme_aurora.jpg',
};

export const GAMEPLAY_THEMES = [
  { id: 'mountains', name: 'Winter Peaks', image: '/extracted/theme_mountains.jpg' },
  { id: 'sunset', name: 'Sunset Ridge', image: '/extracted/theme_sunset.jpg' },
  { id: 'castle', name: 'Moonlit Castle', image: '/extracted/theme_castle.jpg' },
  { id: 'aurora', name: 'Northern Lights', image: '/extracted/theme_aurora.jpg' },
];

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onPlay,
  onOpenCustomize,
  onOpenSettings,
}) => (
  <div className="bf-title relative flex h-full w-full flex-col items-center overflow-hidden px-4 pb-5 pt-4 select-none">
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sky-400/20 via-indigo-500/10 to-slate-950/50" />
    <header className="relative z-10 flex w-full max-w-md items-center justify-between">
      <div className="flex items-center gap-2 rounded-full border border-sky-100/30 bg-slate-950/55 px-3 py-2 shadow-lg backdrop-blur-md">
        <span className="text-lg">⭐</span>
        <span className="text-xs font-black tracking-wide text-white">12</span>
        <span className="ml-1 text-[10px] font-bold text-sky-100/80">PLAYER</span>
      </div>
      <button onClick={onOpenSettings} aria-label="Settings" className="bf-icon-button">
        <Settings className="h-5 w-5" />
      </button>
    </header>

    <section className="relative z-10 flex min-h-0 w-full flex-1 flex-col items-center justify-center py-3">
      <div className="mb-1 text-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-sky-100/30 bg-slate-950/35 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.24em] text-sky-100 shadow backdrop-blur">
          <Sparkles className="h-3 w-3 text-amber-300" /> A little world of big adventures
        </div>
      </div>
      <KodoHeroMascot />
      <button
        onClick={onPlay}
        data-start="true"
        aria-label="Play"
        className="bf-play-button mt-2 flex w-[min(82%,320px)] items-center justify-center gap-3 rounded-[26px] px-6 py-3.5 text-white"
      >
        <Play className="h-7 w-7 fill-current" />
        <span className="text-3xl font-black uppercase tracking-wider">Play</span>
      </button>
      <p className="mt-3 text-center text-[11px] font-semibold text-sky-100/80 drop-shadow">
        Jump into a world of snowy adventures!
      </p>
    </section>

    <nav className="relative z-10 grid w-full max-w-md grid-cols-2 gap-3">
      <button onClick={onPlay} className="bf-nav-button">
        <Trophy className="h-6 w-6 text-amber-300" />
        <span>Modes</span>
      </button>
      <button onClick={onOpenCustomize} className="bf-nav-button">
        <Palette className="h-6 w-6 text-amber-300" />
        <span>Customize</span>
      </button>
    </nav>
    <p className="relative z-10 mt-3 text-[9px] font-bold uppercase tracking-[0.18em] text-sky-100/55">
      Bouncy Friends · Made for fun
    </p>
  </div>
);
