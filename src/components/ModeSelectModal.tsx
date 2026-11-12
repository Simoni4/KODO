import React from 'react';
import { GameMode } from '../game/types';
import { Mountain, Zap, Flame, Trophy, ChevronRight, X, Swords, LockKeyhole } from 'lucide-react';

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
  const modes = [
    { id: 'race' as GameMode, title: 'Race', subtitle: 'Be the fastest jumper', detail: '4 racers', Icon: Zap, theme: 'race', action: () => onSelectMode('race') },
    { id: 'survival' as GameMode, title: 'Survival', subtitle: 'Be the last friend standing', detail: 'Last one alive wins', Icon: Flame, theme: 'survival', action: () => onSelectMode('survival') },
    { id: 'arena' as GameMode, title: 'Eat All Arena', subtitle: 'Outsmart and outlast rivals', detail: '8 contestants', Icon: Swords, theme: 'arena', action: () => onSelectMode('arena') },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-md select-none">
      <div className="bf-modal relative flex max-h-[94dvh] w-full max-w-md flex-col overflow-hidden rounded-[30px] border border-sky-100/50 p-4 shadow-2xl sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-sky-200">Choose your adventure</p>
            <h2 className="text-2xl font-black text-white drop-shadow">Game Modes</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="bf-icon-button !h-9 !w-9"><X className="h-4 w-4" /></button>
        </div>

        <button onClick={onOpenLevelGrid} className="bf-mode-card campaign mb-3 flex w-full items-center gap-3 p-3 text-left">
          <div className="bf-mode-art campaign-art"><Mountain className="h-8 w-8" /><span className="text-2xl">🏁</span></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white">Campaign</h3>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-black text-white">LEVELS</span>
            </div>
            <p className="text-xs font-semibold text-sky-50/90">Explore the islands and complete puzzles</p>
            <p className="mt-1 text-[10px] font-bold text-white/75">Level {currentCampaignLevel + 1} · {unlockedLevel + 1}/{totalLevels} unlocked</p>
          </div>
          <ChevronRight className="h-6 w-6 shrink-0 text-white" />
        </button>

        <div className="flex min-h-0 flex-col gap-3 overflow-y-auto pb-1">
          {modes.map(({ id, title, subtitle, detail, Icon, theme, action }) => (
            <button key={id} onClick={action} className={`bf-mode-card ${theme} flex w-full items-center gap-3 p-3 text-left`}>
              <div className={`bf-mode-art ${theme}-art`}>
                <Icon className="h-8 w-8" />
                <span className="text-xl">{theme === 'race' ? '🏁' : theme === 'survival' ? '❄️' : '🐤'}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-black text-white">{title}</h3>
                <p className="text-xs font-semibold text-white/90">{subtitle}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-white/70">{detail}</p>
              </div>
              <ChevronRight className="h-6 w-6 shrink-0 text-white" />
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-center gap-2 text-[10px] font-bold text-sky-100/65">
          <LockKeyhole className="h-3 w-3" /> More adventures coming soon
        </div>
      </div>
    </div>
  );
};
