import React from 'react';
import { GameMode } from '../game/types';
import { Mountain, Zap, Flame, X, Swords, ChevronRight } from 'lucide-react';

interface ModeSelectModalProps {
  currentCampaignLevel: number;
  unlockedLevel: number;
  totalLevels: number;
  onSelectMode: (mode: GameMode) => void;
  onOpenLevelGrid: () => void;
  onClose: () => void;
}

export const ModeSelectModal: React.FC<ModeSelectModalProps> = ({ currentCampaignLevel, unlockedLevel, totalLevels, onSelectMode, onOpenLevelGrid, onClose }) => {
  const modes = [
    { id: 'campaign' as GameMode, title: 'Campaign', subtitle: 'Explore snowy islands', detail: `Level ${currentCampaignLevel + 1} · ${unlockedLevel + 1}/${totalLevels} unlocked`, Icon: Mountain, art: '🏔️', theme: 'campaign', action: onOpenLevelGrid },
    { id: 'race' as GameMode, title: 'Race', subtitle: 'Be the fastest jumper', detail: '4 RACERS', Icon: Zap, art: '🏁', theme: 'race', action: () => onSelectMode('race') },
    { id: 'survival' as GameMode, title: 'Survival', subtitle: 'Last friend standing', detail: 'LAST ONE ALIVE WINS', Icon: Flame, art: '💀', theme: 'survival', action: () => onSelectMode('survival') },
    { id: 'arena' as GameMode, title: 'Eat All Arena', subtitle: 'Outsmart your rivals', detail: '8 CONTESTANTS', Icon: Swords, art: '🐤', theme: 'arena', action: () => onSelectMode('arena') },
  ];
  return (
    <div className="bf-screen-overlay">
      <section className="bf-mode-screen" role="dialog" aria-modal="true" aria-label="Select game mode">
        <header className="bf-screen-heading">
          <button className="bf-round-icon bf-back-button" onClick={onClose} aria-label="Back"><ChevronRight size={22}/></button>
          <h2><span>Select Mode</span></h2>
          <button className="bf-round-icon" onClick={onClose} aria-label="Close"><X size={20}/></button>
        </header>
        <div className="bf-mode-grid">
          {modes.map(({ id, title, subtitle, detail, Icon, art, theme, action }) => (
            <button key={id} onClick={action} className={`bf-mode-tile ${theme}`}>
              <div className="bf-mode-tile-art"><span>{art}</span><Icon className="bf-mode-tile-icon"/></div>
              <div className="bf-mode-tile-copy"><h3>{title}</h3><p>{subtitle}</p><small>{detail}</small></div>
            </button>
          ))}
        </div>
        <p className="bf-screen-footnote">MORE ADVENTURES COMING SOON</p>
      </section>
    </div>
  );
};
