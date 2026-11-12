import React from 'react';
import { RotateCcw, SkipForward, Pause, Clock, Star, Settings, Navigation } from 'lucide-react';

interface HUDProps {
  title: string;
  timeFormatted: string;
  stars: number;
  maxStars?: number;
  onMove?: (dir: 'up' | 'down' | 'left' | 'right') => void;
  onRestart: () => void;
  onNext?: () => void;
  onPause: () => void;
  onOpenSettings?: () => void;
  canNext?: boolean;
  extraBadge?: string;
}

export const HUD: React.FC<HUDProps> = ({
  title,
  timeFormatted,
  stars,
  maxStars = 3,
  onRestart,
  onNext,
  onPause,
  onOpenSettings,
  canNext = false,
  extraBadge,
}) => {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 sm:p-5 select-none z-20 bf-game-hud">
      {/* Top Bar matching reference */}
      <div className="flex items-center justify-between w-full">
        {/* Left cluster: Level Pill & Timer */}
        <div className="flex flex-col gap-1.5">
          <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-2xl bf-hud-pill text-white">
            <span className="font-extrabold text-xs sm:text-sm tracking-wide text-sky-200">
              {title}
            </span>
            {extraBadge && (
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-400/30">
                {extraBadge}
              </span>
            )}
          </div>

          <div className="pointer-events-auto flex items-center gap-1.5 px-3 py-1 rounded-xl bf-hud-timer text-xs font-mono font-bold tabular-nums">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{timeFormatted}</span>
          </div>
        </div>

        {/* Right cluster: Stars & Utility buttons */}
        <div className="flex items-center gap-2">
          {/* Stars */}
          <div className="pointer-events-auto flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bf-hud-stars">
            {Array.from({ length: maxStars }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 transition-transform duration-300 ${
                  i < stars
                    ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.6)] scale-110'
                    : 'text-slate-600 fill-slate-800'
                }`}
              />
            ))}
          </div>

          {/* Pause Button */}
          <button
            onClick={onPause}
            aria-label="Pause Game"
            className="pointer-events-auto w-9 h-9 sm:w-10 sm:h-10 rounded-xl bf-hud-icon active:scale-95 flex items-center justify-center transition-transform cursor-pointer"
          >
            <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          </button>

          {/* Settings Button */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              aria-label="Open Settings"
              className="pointer-events-auto w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-b from-slate-700 to-slate-900 hover:from-slate-600 hover:to-slate-800 border-2 border-slate-600/60 active:scale-95 shadow-lg flex items-center justify-center text-sky-200 transition-transform cursor-pointer"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom Bar: Clean, spacious (no D-pad buttons!) */}
      <div className="flex items-end justify-between w-full pb-2">
        {/* Left: Tap-to-move hint indicator badge */}
        <div className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bf-hud-hint text-[11px] font-medium">
          <Navigation className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
          <span>Tap screen to hop</span>
        </div>

        {/* Right Action Buttons: RESTART & NEXT */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={onRestart}
            aria-label="Restart Level"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bf-hud-action text-xs sm:text-sm font-bold active:scale-95 cursor-pointer uppercase tracking-wider"
          >
            <RotateCcw className="w-4 h-4 text-sky-400" />
            <span>Restart</span>
          </button>

          {canNext && onNext && (
            <button
              onClick={onNext}
              aria-label="Next Level"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bf-hud-next text-xs sm:text-sm font-extrabold active:scale-95 cursor-pointer uppercase tracking-wider"
            >
              <span>Next</span>
              <SkipForward className="w-4 h-4 fill-current" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
