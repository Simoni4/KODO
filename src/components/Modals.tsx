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

  const selected = colors.find((option) => option.value === color) || colors[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-3xl border-2 border-violet-400/40 bg-slate-900 p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black uppercase tracking-wide text-white">Customize Friend</h2>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300">Character preview</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700">×</button>
        </div>

        <div className="relative mb-5 flex h-52 flex-col items-center justify-center overflow-hidden rounded-2xl border border-sky-400/20 bg-gradient-to-b from-sky-900 via-slate-900 to-slate-950">
          <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle, rgba(186,230,253,.7) 1px, transparent 1.5px)', backgroundSize: '22px 22px' }} />
          <div className="absolute bottom-7 h-5 w-28 rounded-full bg-slate-950/70 blur-md" />
          <svg viewBox="0 0 180 170" role="img" aria-label={selected.label + ' Bouncy Friends character preview'} className="relative z-10 h-40 w-40 overflow-visible" style={{ animation: 'kodo-preview-hop 1.45s ease-in-out infinite' }}>
            <defs>
              <radialGradient id="kodo-body-gradient" cx="32%" cy="24%" r="78%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity=".58" />
                <stop offset="42%" stopColor={color} />
                <stop offset="100%" stopColor="#0f172a" stopOpacity=".72" />
              </radialGradient>
              <linearGradient id="kodo-belly-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#dbeafe" />
              </linearGradient>
              <linearGradient id="kodo-beak-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <filter id="kodo-shadow"><feGaussianBlur stdDeviation="2.5" /></filter>
            </defs>
            <ellipse cx="90" cy="151" rx="39" ry="7" fill="#020617" opacity=".48" filter="url(#kodo-shadow)" />
            <g className="kodo-character">
              <polygon points="58,91 43,82 49,107 66,112" fill={color} />
              <polygon points="122,91 137,82 131,107 114,112" fill="#075985" />
              <polygon points="76,47 69,17 86,34 89,49" fill={color} />
              <polygon points="87,45 92,9 105,30 99,49" fill="#38bdf8" />
              <polygon points="99,48 119,22 116,48 108,56" fill="#7dd3fc" />
              <polygon points="48,81 67,75 73,104 58,119 47,102" fill="#075985" />
              <polygon points="132,81 113,75 107,104 122,119 133,102" fill={color} />
              <polygon points="90,39 119,48 137,78 131,112 108,139 77,137 52,111 47,78 63,49" fill="#075985" />
              <polygon points="90,39 119,48 104,82 72,82 63,49" fill={color} />
              <polygon points="119,48 137,78 131,112 105,95 104,82" fill="#0284c7" />
              <polygon points="63,49 72,82 52,111 47,78" fill="#38bdf8" />
              <polygon points="72,82 104,82 112,119 90,139 68,119" fill="#e0f2fe" />
              <polygon points="72,82 90,84 90,139 68,119" fill="#ffffff" />
              <polygon points="104,82 112,119 90,139 90,84" fill="#dbeafe" />
              <polygon points="65,128 84,130 82,143 61,142" fill="#f59e0b" />
              <polygon points="96,130 115,128 119,142 98,143" fill="#d97706" />
              <polygon points="69,76 84,72 86,91 72,98" fill="#ffffff" />
              <polygon points="96,72 111,76 108,98 94,91" fill="#ffffff" />
              <ellipse cx="78" cy="84" rx="5" ry="7" fill="#172554" />
              <ellipse cx="102" cy="84" rx="5" ry="7" fill="#172554" />
              <circle cx="79" cy="81" r="2" fill="white" />
              <circle cx="103" cy="81" r="2" fill="white" />
              <polygon points="81,94 99,94 90,108" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
              <polygon points="49,103 61,96 70,110 58,120" fill="#075985" />
              <polygon points="131,103 119,96 110,110 122,120" fill="#0284c7" />
              <polygon points="53,104 65,99 70,110 59,116" fill="#38bdf8" />
              <polygon points="127,104 115,99 110,110 121,116" fill="#7dd3fc" />
              <polygon points="49,108 65,101 115,101 131,108 123,120 57,120" fill="#b91c1c" />
              <polygon points="49,108 65,101 91,108 87,120 57,120" fill="#ef4444" />
              <polygon points="91,108 115,101 131,108 123,120 91,119" fill="#dc2626" />
              <polygon points="98,116 114,114 112,143 102,147 96,140" fill="#dc2626" />
              <polygon points="98,116 106,115 103,145 96,140" fill="#f87171" />
            </g>
          </svg>
          <div className="relative z-10 -mt-1 text-center">
            <div className="text-sm font-black text-white">Your Friend</div>
            <div className="text-[10px] font-semibold text-sky-200">{selected.label}</div>
          </div>
          <style>{`
            @keyframes kodo-preview-hop {
              0%, 100% { transform: translateY(8px) scaleX(1.04) scaleY(.94); }
              18% { transform: translateY(5px) scaleX(1.08) scaleY(.9); }
              42% { transform: translateY(-22px) scaleX(.96) scaleY(1.06); }
              62% { transform: translateY(-18px) scaleX(.98) scaleY(1.04); }
              82% { transform: translateY(2px) scaleX(1.06) scaleY(.92); }
            }
          `}</style>
        </div>

        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-wide text-sky-200">Body color</p>
          <span className="text-[10px] font-semibold text-slate-400">Live preview</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {colors.map((option) => (
            <button
              key={option.value}
              onClick={() => onColorChange(option.value)}
              aria-label={option.label}
              aria-pressed={color === option.value}
              title={option.label}
              className={"group flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition-all " + (color === option.value ? "border-white bg-slate-700/80 shadow-lg shadow-sky-500/20" : "border-slate-700 bg-slate-800/70 hover:border-slate-500")}
            >
              <span className="h-7 w-7 rounded-full border-2 border-white/30 shadow-inner" style={{ backgroundColor: option.value }} />
              <span className="text-[9px] font-bold text-slate-300">{option.label}</span>
              {color === option.value && <span className="text-[9px] font-black uppercase text-sky-300">Selected</span>}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="mt-5 w-full rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 py-3 text-sm font-black uppercase text-white shadow-lg shadow-violet-950/30 hover:brightness-110">Save appearance</button>
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
