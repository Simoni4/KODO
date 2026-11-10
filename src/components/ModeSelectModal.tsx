import React from 'react';
import { GameMode } from '../game/types';
import { Mountain, Zap, Flame, Trophy, ChevronRight, X, Sparkles, Swords } from 'lucide-react';

interface ModeSelectModalProps {
  currentCampaignLevel: number;
  unlockedLevel: number;
  totalLevels: number;
  onSelectMode: (mode: GameMode) => void;
  onOpenLevelGrid: () => void;
  onClose: () => void;
}

export const ModeSelectModal: React.FC<ModeSelectModalProps> = ({
  currentCampaignLevel,
  unlockedLevel,
  totalLevels,
  onSelectMode,
  onOpenLevelGrid,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-sm sm:max-w-md flex flex-col bg-slate-900 border-2 border-sky-400/50 rounded-3xl shadow-2xl overflow-hidden p-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black text-white uppercase tracking-wider">
              Choose Game Mode
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Mode Cards */}
        <div className="flex flex-col gap-3 py-4">
          {/* 1. Campaign Mode */}
          <div className="group relative flex flex-col p-4 rounded-2xl bg-gradient-to-r from-sky-950/80 to-blue-900/60 border-2 border-sky-500/40 hover:border-sky-400 shadow-lg transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-sky-500/20 border border-sky-400/50 flex items-center justify-center text-sky-300">
                  <Mountain className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white group-hover:text-sky-200 transition-colors">
                    Campaign Mode
                  </h3>
                  <p className="text-xs text-sky-200/70">
                    18 3D puzzles (9x9) · Crates, switches &amp; gates
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-300 border border-sky-400/30">
                Lvl {currentCampaignLevel + 1}/{totalLevels}
              </span>
            </div>

            <div className="flex gap-2 mt-3 pt-3 border-t border-sky-800/40">
              <button
                onClick={() => onSelectMode('campaign')}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-xs uppercase shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Play Level {currentCampaignLevel + 1}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenLevelGrid}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase border border-slate-600/80 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Grid</span>
              </button>
            </div>
          </div>

          {/* 2. AI Race Mode */}
          <button
            onClick={() => onSelectMode('race')}
            className="group relative flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-amber-950/70 to-orange-900/60 border-2 border-amber-500/40 hover:border-amber-400 shadow-lg text-left transition-all cursor-pointer active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white group-hover:text-amber-200 transition-colors">
                  AI Race Tournament
                </h3>
                <p className="text-xs text-amber-200/70">
                  4 racers · 14x14 fair symmetric arena
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-amber-500/30 group-hover:bg-amber-500/50 flex items-center justify-center text-amber-300 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>

          {/* 3. Survival Mode */}
          <button
            onClick={() => onSelectMode('survival')}
            className="group relative flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-rose-950/70 to-red-900/60 border-2 border-rose-500/40 hover:border-rose-400 shadow-lg text-left transition-all cursor-pointer active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-400/50 flex items-center justify-center text-rose-300">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white group-hover:text-rose-200 transition-colors">
                  Survival Ice Platform
                </h3>
                <p className="text-xs text-rose-200/70">
                  14x14 crumbling floor · Be the last bird standing
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-rose-500/30 group-hover:bg-rose-500/50 flex items-center justify-center text-rose-300 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>

          {/* 4. Eat All Arena */}
          <button
            onClick={() => onSelectMode('arena')}
            className="group relative flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-violet-950/70 to-fuchsia-900/60 border-2 border-violet-500/40 hover:border-violet-400 shadow-lg text-left transition-all cursor-pointer active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-violet-500/20 border border-violet-400/50 flex items-center justify-center text-violet-300">
                <Swords className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white group-hover:text-violet-200 transition-colors">Eat All Arena</h3>
                <p className="text-xs text-violet-200/70">8 contestants · Eat rivals by landing on their tile</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-violet-500/30 flex items-center justify-center text-violet-300">
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
