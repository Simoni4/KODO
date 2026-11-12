import React from 'react';

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
