import React from 'react';
import { Settings, Play, Sparkles, Palette, Trophy, ShoppingBag } from 'lucide-react';
import { KodoHeroMascot } from './KodoHeroMascot';

interface TitleScreenProps { onPlay: () => void; onOpenCustomize: () => void; onOpenSettings: () => void; }

export const MAIN_MENU_THEME = { id:'aurora', name:'Northern Lights Winter Biome', image:'/extracted/theme_aurora.jpg' };
export const GAMEPLAY_THEMES = [
  {id:'mountains',name:'Winter Peaks',image:'/extracted/theme_mountains.jpg'},
  {id:'sunset',name:'Sunset Ridge',image:'/extracted/theme_sunset.jpg'},
  {id:'castle',name:'Moonlit Castle',image:'/extracted/theme_castle.jpg'},
  {id:'aurora',name:'Northern Lights',image:'/extracted/theme_aurora.jpg'},
];

export const TitleScreen: React.FC<TitleScreenProps> = ({onPlay,onOpenCustomize,onOpenSettings}) => (
  <div className="bf-title relative flex h-full w-full flex-col items-center overflow-hidden px-4 pb-4 pt-4 select-none">
    <div className="bf-menu-vignette pointer-events-none absolute inset-0"/>
    <header className="relative z-10 flex w-full max-w-md items-center justify-between">
      <div className="bf-player-pill flex items-center gap-2 rounded-full px-3 py-2"><span className="text-lg">⭐</span><span className="text-xs font-black text-white">12</span><span className="ml-1 text-[10px] font-bold tracking-wider text-sky-100/80">PLAYER</span></div>
      <button onClick={onOpenSettings} aria-label="Settings" className="bf-icon-button"><Settings className="h-5 w-5"/></button>
    </header>
    <section className="relative z-10 flex min-h-0 w-full flex-1 flex-col items-center justify-center pt-2 pb-1">
      <div className="bf-wordmark relative z-10 text-center"><div className="text-[clamp(2.35rem,11vw,4rem)] font-black leading-[0.86] tracking-tight text-white">BOUNCY</div><div className="mt-1 text-[clamp(2.65rem,12vw,4.35rem)] font-black leading-[0.88] tracking-tight text-amber-300">FRIENDS</div></div>
      <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-sky-100/35 bg-slate-950/35 px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.22em] text-sky-100 shadow backdrop-blur-sm"><Sparkles className="h-3 w-3 text-amber-300"/> A little world of big adventures</div>
      <KodoHeroMascot/>
      <button onClick={onPlay} data-start="true" aria-label="Play" className="bf-play-button mt-[-4px] flex w-[min(82%,320px)] items-center justify-center gap-3 rounded-[26px] px-6 py-3 text-white"><Play className="h-7 w-7 fill-current"/><span className="text-3xl font-black uppercase tracking-wider">Play</span></button>
      <p className="mt-2 text-center text-[10px] font-semibold text-sky-100/85 drop-shadow">Jump into a world of snowy adventures!</p>
    </section>
    <nav className="relative z-10 grid w-full max-w-md grid-cols-3 gap-2.5">
      <button onClick={onPlay} className="bf-nav-button"><Trophy className="h-6 w-6 text-amber-300"/><span>Modes</span></button>
      <button onClick={onOpenCustomize} className="bf-nav-button"><Palette className="h-6 w-6 text-amber-300"/><span>Customize</span></button>
      <div className="bf-nav-button bf-nav-coming-soon" aria-label="Shop coming soon"><ShoppingBag className="h-6 w-6 text-amber-300"/><span>Shop</span><small>SOON</small></div>
    </nav>
    <p className="relative z-10 mt-2 text-[8px] font-bold uppercase tracking-[0.18em] text-sky-100/65">Bouncy Friends · Made for fun</p>
  </div>
);