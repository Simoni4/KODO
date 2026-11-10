import React from 'react';
import { Settings, Play, Sparkles, Palette } from 'lucide-react';
import { KodoHeroMascot } from './KodoHeroMascot';

interface TitleScreenProps {
  onPlay: () => void;
  onOpenCustomize: () => void;
  onOpenSettings: () => void;
}

// Single Unique Fixed Wallpaper for Main Menu
export const MAIN_MENU_THEME = {
  id: 'aurora',
  name: 'Northern Lights Winter Biome',
  image: '/extracted/theme_aurora.jpg',
};

// Gameplay Backgrounds randomly selected per game session/level/match
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
}) => {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-4 sm:p-6 overflow-hidden select-none">
      {/* Top Bar with Single Settings Button & Title Tag */}
      <div className="w-full flex items-center justify-between z-10 max-w-md">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/70 border border-sky-400/30 text-sky-200 text-xs font-semibold backdrop-blur-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Winter Edition</span>
        </div>

        {/* Single clean Settings button */}
        <button
          onClick={onOpenSettings}
          aria-label="Open Settings"
          className="w-10 h-10 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 shadow-lg flex items-center justify-center text-sky-200 active:scale-95 transition-transform cursor-pointer"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Centerpiece: Animated Kodo Bird Mascot with Snowy 3D Title */}
      <div className="flex flex-col items-center z-10 my-auto">
        <KodoHeroMascot />

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-64 sm:w-72 mt-4">
          {/* PLAY Button -> Opens Mode Selector! */}
          <button
            onClick={onPlay}
            data-start="true"
            aria-label="Start Game"
            className="group relative flex items-center justify-center gap-3 w-full py-4 rounded-3xl bg-gradient-to-b from-amber-400 via-orange-500 to-orange-600 hover:from-amber-300 hover:via-orange-400 hover:to-orange-500 active:translate-y-0.5 border-4 border-amber-200 shadow-[0_8px_20px_rgba(249,115,22,0.5)] active:scale-98 transition-all cursor-pointer"
          >
            <Play className="w-7 h-7 fill-white text-white drop-shadow-md group-hover:scale-110 transition-transform" />
            <span className="text-2xl font-black text-white uppercase tracking-wider drop-shadow-md">
              Play
            </span>
          </button>

          {/* Character customization */}
          <button
            onClick={onOpenCustomize}
            aria-label="Customize character"
            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-b from-violet-600 to-indigo-800 hover:from-violet-500 hover:to-indigo-700 border-2 border-violet-300/60 shadow-lg active:scale-95 text-white font-bold text-sm uppercase tracking-wide transition-all cursor-pointer"
          >
            <Palette className="w-4 h-4 text-amber-200" />
            <span>Customize Kodo</span>
          </button>
        </div>
      </div>

      {/* Bottom Area: Control hint */}
      <div className="w-full flex flex-col items-center gap-2 z-10 max-w-md pb-2">
        <div className="px-4 py-2 rounded-2xl bg-slate-950/60 border border-slate-800 backdrop-blur-xs">
          <p className="text-[11px] text-sky-200/90 text-center font-medium">
            One-Tap Screen · Clockwise 4-Direction Indicator · WASD / Arrows
          </p>
        </div>
      </div>
    </div>
  );
};
