import React from 'react';
import { Star, RotateCcw, Play, ArrowRight, X, Volume2, VolumeX, Music, HelpCircle, Trophy } from 'lucide-react';
import { CAMPAIGN_LEVELS } from '../game/campaignLevels';

// Level Select Modal
interface LevelSelectModalProps {
  unlockedLevel: number;
  levelStars: Record<string, number>;
  bestTimes: Record<string, number>;
  onSelectLevel: (index: number) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  unlockedLevel,
  levelStars,
  bestTimes,
  onSelectLevel,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-md max-h-[85vh] flex flex-col bg-slate-900 border-2 border-sky-500/40 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black text-white tracking-wide uppercase">
              Campaign Levels (18)
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

        {/* Level Grid */}
        <div className="p-4 overflow-y-auto grid grid-cols-3 gap-3">
          {CAMPAIGN_LEVELS.map((lvl, idx) => {
            const isUnlocked = idx <= unlockedLevel;
            const stars = levelStars[lvl.id] || 0;
            const bestTime = bestTimes[lvl.id];

            return (
              <button
                key={lvl.id}
                disabled={!isUnlocked}
                onClick={() => {
                  onSelectLevel(idx);
                  onClose();
                }}
                className={`relative flex flex-col items-center justify-between p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                  isUnlocked
                    ? 'bg-gradient-to-b from-sky-900/60 to-slate-800/80 hover:from-sky-800 hover:to-slate-700 border-sky-400/50 shadow-md active:scale-95'
                    : 'bg-slate-950/60 border-slate-800/60 opacity-40 cursor-not-allowed'
                }`}
              >
                <span className="text-base font-extrabold text-white">
                  {idx + 1}
                </span>
                <span className="text-[10px] text-sky-200/80 font-medium truncate max-w-full">
                  {lvl.name.replace(/^\d+\.\s*/, '')}
                </span>

                {/* Stars */}
                <div className="flex gap-0.5 mt-1.5">
                  {[0, 1, 2].map((s) => (
                    <Star
                      key={s}
                      className={`w-3 h-3 ${
                        s < stars
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-600 fill-slate-700'
                      }`}
                    />
                  ))}
                </div>

                {bestTime && (
                  <span className="text-[9px] font-mono text-amber-300/80 mt-1">
                    {bestTime}s
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Settings Modal
interface SettingsModalProps {
  sfxEnabled: boolean;
  musicEnabled: boolean;
  nickname: string;
  onNicknameChange: (value: string) => void;
  onToggleSfx: () => void;
  onToggleMusic: () => void;
  onResetProgress: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  sfxEnabled,
  musicEnabled,
  nickname,
  onNicknameChange,
  onToggleSfx,
  onToggleMusic,
  onResetProgress,
  onClose,
}) => {
  const [confirmReset, setConfirmReset] = React.useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-sm flex flex-col bg-slate-900 border-2 border-sky-500/40 rounded-3xl shadow-2xl overflow-hidden p-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-lg font-black text-white uppercase tracking-wider">Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 py-4">
          <label className="flex flex-col gap-1.5 rounded-2xl border border-sky-500/30 bg-slate-800/80 p-3">
            <span className="text-xs font-bold uppercase tracking-wide text-sky-200">Player nickname</span>
            <input value={nickname} onChange={(event) => onNicknameChange(event.target.value.slice(0, 14))} maxLength={14} placeholder="Enter your nickname" className="w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 text-sm font-bold text-white outline-none focus:border-sky-400" />
            <span className="text-[10px] text-slate-400">Up to 14 characters · shown above your character in multiplayer modes</span>
          </label>
          {/* Sound FX Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
            <div className="flex items-center gap-2.5 text-white font-bold text-sm">
              {sfxEnabled ? <Volume2 className="w-5 h-5 text-sky-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
              <span>Sound Effects (SFX)</span>
            </div>
            <button
              onClick={onToggleSfx}
              aria-label="Toggle Sound Effects"
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                sfxEnabled ? 'bg-sky-500 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
            </button>
          </div>

          {/* Music Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
            <div className="flex items-center gap-2.5 text-white font-bold text-sm">
              <Music className={`w-5 h-5 ${musicEnabled ? 'text-amber-400' : 'text-slate-500'}`} />
              <span>Winter Chimes Ambient</span>
            </div>
            <button
              onClick={onToggleMusic}
              aria-label="Toggle Ambient Music"
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                musicEnabled ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
            </button>
          </div>

          {/* Controls Information */}
          <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800 text-xs text-sky-200/80 leading-relaxed">
            <div className="flex items-center gap-1.5 text-white font-bold mb-1">
              <HelpCircle className="w-4 h-4 text-sky-400" />
              <span>How To Play</span>
            </div>
            <p>• <strong>One-Tap Hop:</strong> Tap anywhere on screen to hop in the clockwise blinking arrow direction, or tap an adjacent block directly.</p>
            <p>• <strong>Crates:</strong> Hop into wooden crates to push them onto switches or clear paths.</p>
            <p>• <strong>Enemies:</strong> Dodge red chaser imps &amp; mines. Hop onto tasty bugs to squash them!</p>
            <p>• <strong>Race &amp; Survival:</strong> Shove opponents off platforms to knock them out.</p>
          </div>

          {/* Reset progress (inline confirmation without window.confirm) */}
          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="w-full py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-bold transition-colors cursor-pointer"
            >
              Reset Progress
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onResetProgress();
                  setConfirmReset(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold transition-colors cursor-pointer"
              >
                Confirm Reset
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export const CharacterCustomizeModal: React.FC<{
  color: string;
  onColorChange: (color: string) => void;
  onClose: () => void;
}> = ({ color, onColorChange, onClose }) => {
  const colors = [
    { value: '#0284c7', label: 'Ocean Blue' },
    { value: '#ef4444', label: 'Berry Red' },
    { value: '#a855f7', label: 'Mystic Purple' },
    { value: '#eab308', label: 'Golden' },
    { value: '#10b981', label: 'Mint' },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-3xl border-2 border-violet-400/40 bg-slate-900 p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black uppercase tracking-wide text-white">Customize Kodo</h2>
          <button onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-300">×</button>
        </div>
        <div className="mb-4 flex flex-col items-center rounded-2xl border border-slate-700 bg-gradient-to-b from-sky-950 to-slate-950 p-5">
          <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/20 shadow-xl" style={{ background: "radial-gradient(circle at 35% 30%, #ffffff, " + color + " 48%, #0f172a)" }}>
            <span className="text-5xl drop-shadow-lg">🐦</span>
          </div>
          <span className="text-sm font-black text-white">Your Kodo</span>
          <span className="text-[10px] text-slate-400">More outfits and accessories coming soon</span>
        </div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-sky-200">Body color</p>
        <div className="grid grid-cols-5 gap-2">
          {colors.map(option => (
            <button key={option.value} onClick={() => onColorChange(option.value)} aria-label={option.label} title={option.label} className={"flex aspect-square items-center justify-center rounded-xl border-2 " + (color === option.value ? "border-white ring-2 ring-sky-400" : "border-slate-600")} style={{ backgroundColor: option.value }}>
              {color === option.value && <span className="text-lg font-black text-white">✓</span>}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="mt-5 w-full rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 py-3 text-sm font-black uppercase text-white">Save appearance</button>
      </div>
    </div>
  );
};

// Victory Modal
interface VictoryModalProps {
  title: string;
  stars: number;
  moves: number;
  parMoves: number;
  timeSeconds: number;
  modeName?: string;
  onNext: () => void;
  onRestart: () => void;
  onMainMenu?: () => void;
  hasNext: boolean;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  title,
  stars,
  moves,
  parMoves,
  timeSeconds,
  modeName,
  onNext,
  onRestart,
  onMainMenu,
  hasNext,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-sm flex flex-col items-center bg-gradient-to-b from-slate-900 to-sky-950 border-3 border-amber-400/80 rounded-3xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
        {/* Victory Stars Header */}
        <div className="flex items-center justify-center gap-2 mb-3">
          {[1, 2, 3].map((starIdx) => (
            <div key={starIdx} className="relative">
              <Star
                className={`w-10 h-10 transition-all transform ${
                  starIdx <= stars
                    ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)] scale-110 animate-bounce'
                    : 'text-slate-700 fill-slate-800'
                }`}
                style={{ animationDelay: `${starIdx * 0.15}s`, animationDuration: '1s' }}
              />
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-black text-white uppercase tracking-wider drop-shadow-md">
          {modeName === 'race' ? '1st Place Winner!' : modeName === 'survival' ? 'Champion Survivor!' : 'Level Cleared!'}
        </h2>
        <p className="text-sky-300 font-bold text-sm mt-0.5">{title}</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 w-full my-4 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">
              {moves > 0 ? 'Moves' : 'Status'}
            </span>
            <span className="text-lg font-black text-white tabular-nums">
              {moves > 0 ? (
                <>
                  {moves} <span className="text-xs text-slate-400 font-normal">/ {parMoves}</span>
                </>
              ) : (
                <span className="text-amber-400 font-extrabold text-sm uppercase">1st Place</span>
              )}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Time</span>
            <span className="text-lg font-black text-amber-300 tabular-nums">
              {timeSeconds}s
            </span>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col gap-2 w-full mt-2">
          <div className="flex gap-2 w-full">
            <button
              onClick={onRestart}
              aria-label="Replay Level"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-sm uppercase transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Replay</span>
            </button>

            {hasNext && (
              <button
                onClick={onNext}
                data-start="true"
                aria-label="Next Level"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 border border-amber-200 text-white font-extrabold text-sm uppercase shadow-lg shadow-orange-950/50 transition-all cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {onMainMenu && (
            <button
              onClick={onMainMenu}
              aria-label="Main Menu"
              className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white font-bold text-xs uppercase transition-colors cursor-pointer"
            >
              Main Menu
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Defeat Modal (with Skip Level option after 3 fails)
interface DefeatModalProps {
  reason: string;
  attemptCount: number;
  onRetry: () => void;
  onSkip?: () => void;
  onMainMenu?: () => void;
}

export const DefeatModal: React.FC<DefeatModalProps> = ({
  reason,
  attemptCount,
  onRetry,
  onSkip,
  onMainMenu,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-sm flex flex-col items-center bg-gradient-to-b from-slate-900 to-rose-950 border-3 border-rose-500/80 rounded-3xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-full bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center mb-3 text-rose-300 text-2xl font-black">
          ✕
        </div>

        <h2 className="text-2xl font-black text-white uppercase tracking-wider">
          Oops!
        </h2>
        <p className="text-rose-200 text-sm mt-1">{reason}</p>

        <div className="flex flex-col gap-2.5 w-full mt-5">
          <button
            onClick={onRetry}
            data-start="true"
            aria-label="Try Again"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 border border-rose-300 text-white font-black text-sm uppercase shadow-lg shadow-rose-950/50 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          {attemptCount >= 3 && onSkip && (
            <button
              onClick={onSkip}
              aria-label="Skip Level"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-amber-400/50 text-amber-300 font-bold text-xs uppercase transition-all cursor-pointer"
            >
              <span>Skip Level</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {onMainMenu && (
            <button
              onClick={onMainMenu}
              aria-label="Main Menu"
              className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white font-bold text-xs uppercase transition-colors cursor-pointer mt-1"
            >
              Main Menu
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Pause Modal
interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenLevels?: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onOpenLevels,
  onMainMenu,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-xs flex flex-col items-center bg-slate-900 border-2 border-sky-500/40 rounded-3xl shadow-2xl p-5 text-center animate-in zoom-in-95 duration-200">
        <h2 className="text-xl font-black text-white uppercase tracking-wider mb-4">
          Game Paused
        </h2>

        <div className="flex flex-col gap-2.5 w-full">
          <button
            onClick={onResume}
            data-start="true"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-sm uppercase shadow-md transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume</span>
          </button>

          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase border border-slate-700 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart</span>
          </button>

          {onOpenLevels && (
            <button
              onClick={onOpenLevels}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase border border-slate-700 transition-all cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Select Level</span>
            </button>
          )}

          <button
            onClick={onMainMenu}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs uppercase border border-slate-800 transition-all cursor-pointer mt-1"
          >
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
