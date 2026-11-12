import React from 'react';
import { Settings, Play, Palette, Trophy, ShoppingBag, Star } from 'lucide-react';
import { KodoHeroMascot } from './KodoHeroMascot';

export const MAIN_MENU_THEME = { id: 'aurora', name: 'Northern Lights Winter Biome', image: '/extracted/theme_aurora.jpg' };
export const GAMEPLAY_THEMES = [
  { id: 'mountains', name: 'Winter Peaks', image: '/extracted/theme_mountains.jpg' },
  { id: 'sunset', name: 'Sunset Ridge', image: '/extracted/theme_sunset.jpg' },
  { id: 'castle', name: 'Moonlit Castle', image: '/extracted/theme_castle.jpg' },
  { id: 'aurora', name: 'Northern Lights', image: '/extracted/theme_aurora.jpg' },
];

interface TitleScreenProps {
  onPlay: () => void;
  onOpenCustomize: () => void;
  onOpenSettings: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onPlay, onOpenCustomize, onOpenSettings }) => (
  <div className="bf-home-screen">
    <div className="bf-home-sky" aria-hidden="true">
      <span className="bf-sky-star s1"/><span className="bf-sky-star s2"/><span className="bf-sky-star s3"/>
      <span className="bf-far-island island-left"/><span className="bf-far-island island-right"/>
    </div>
    <header className="bf-home-header">
      <div className="bf-player-badge">
        <span className="bf-player-avatar">🐤</span>
        <span className="bf-player-meta"><b>Player</b><span><Star size={13} fill="currentColor"/> 12</span></span>
      </div>
      <button className="bf-round-icon" onClick={onOpenSettings} aria-label="Settings"><Settings size={21}/></button>
    </header>

    <section className="bf-home-hero">
      <div className="bf-home-logo" aria-label="Bouncy Friends">
        <span>BOUNCY</span><strong>FRIENDS</strong>
      </div>
      <div className="bf-home-tagline">A LITTLE WORLD OF BIG ADVENTURES</div>
      <KodoHeroMascot/>
      <button className="bf-main-play" onClick={onPlay} data-start="true"><Play size={27} fill="currentColor"/><span>PLAY</span></button>
      <p className="bf-home-caption">Jump into a world of snowy adventures!</p>
    </section>

    <nav className="bf-home-nav" aria-label="Main menu">
      <button className="bf-home-nav-button" onClick={onPlay}><Trophy/><span>Modes</span></button>
      <button className="bf-home-nav-button" onClick={onOpenCustomize}><Palette/><span>Customize</span></button>
      <button className="bf-home-nav-button bf-shop-button" type="button" aria-label="Shop coming soon"><ShoppingBag/><span>Shop</span><small>SOON</small></button>
    </nav>
    <div className="bf-home-footer">BOUNCY FRIENDS · MADE FOR FUN</div>
  </div>
);
