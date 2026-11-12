import React from 'react';

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

/**
 * The approved concept art is the actual menu artwork.
 * Transparent hit areas keep the illustrated buttons connected to game actions.
 */
export const TitleScreen: React.FC<TitleScreenProps> = ({
  onPlay,
  onOpenCustomize,
  onOpenSettings,
}) => (
  <div className="bf-concept-screen" aria-label="Bouncy Friends main menu">
    <img
      className="bf-concept-art"
      src="/assets/bouncy-friends-title.webp"
      alt="Bouncy Friends winter floating-island main menu concept"
      draggable={false}
    />

    {/* The concept artwork has a second Settings badge in its bottom row.
        Cover only that duplicated badge with a snow drift; Settings remains top-right. */}
    <div className="bf-duplicate-settings-cover" aria-hidden="true" />

    <button
      className="bf-concept-hit bf-hit-settings"
      onClick={onOpenSettings}
      aria-label="Open settings"
      title="Settings"
    />
    <button
      className="bf-concept-hit bf-hit-play"
      onClick={onPlay}
      aria-label="Play"
      data-start="true"
    />
    <button
      className="bf-concept-hit bf-hit-modes"
      onClick={onPlay}
      aria-label="Game modes"
      title="Modes"
    />
    <button
      className="bf-concept-hit bf-hit-customize"
      onClick={onOpenCustomize}
      aria-label="Customize character"
      title="Customize"
    />
    <div className="bf-hit-shop" aria-label="Shop coming soon" title="Shop coming soon" />
  </div>
);
