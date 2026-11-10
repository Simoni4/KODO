/**
 * Kodo (Winter Edition) - Main Application Entry
 * Isometric Turn-Based Puzzle & Casual Arcade Game
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameMode } from './game/types';
import { CAMPAIGN_LEVELS } from './game/campaignLevels';
import { KodoAudioManager } from './game/audio';
import { TitleScreen, MAIN_MENU_THEME, GAMEPLAY_THEMES } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { CampaignView } from './components/CampaignView';
import { RaceView } from './components/RaceView';
import { SurvivalView } from './components/SurvivalView';
import { ArenaView, ArenaResultsModal } from './components/ArenaView';
import type { ArenaPlacement } from './components/ArenaView';
import { ModeSelectModal } from './components/ModeSelectModal';
import {
  LevelSelectModal,
  SettingsModal,
  VictoryModal,
  DefeatModal,
  PauseModal,
} from './components/Modals';

export default function App() {
  // Screen state: 'title' | 'playing' | 'paused' | 'gameover'
  const [screen, setScreen] = useState<'title' | 'playing' | 'paused' | 'gameover'>('title');
  const [mode, setMode] = useState<GameMode>('campaign');

  // Campaign Progress
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(0);
  const [unlockedLevel, setUnlockedLevel] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('kodo_unlocked');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [levelStars, setLevelStars] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('kodo_stars');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [bestTimes, setBestTimes] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('kodo_times');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [failCounts, setFailCounts] = useState<Record<string, number>>({});

  // Gameplay Wallpaper Theme (randomly assigned per match/session)
  const [gameplayThemeIndex, setGameplayThemeIndex] = useState<number>(() =>
    Math.floor(Math.random() * GAMEPLAY_THEMES.length)
  );

  const randomizeGameplayTheme = () => {
    setGameplayThemeIndex((prev) => {
      const next = Math.floor(Math.random() * GAMEPLAY_THEMES.length);
      return next === prev && GAMEPLAY_THEMES.length > 1 ? (next + 1) % GAMEPLAY_THEMES.length : next;
    });
  };

  // Modals
  const [showModeSelect, setShowModeSelect] = useState<boolean>(false);
  const [showLevelSelect, setShowLevelSelect] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showVictory, setShowVictory] = useState<boolean>(false);
  const [showDefeat, setShowDefeat] = useState<boolean>(false);
  const [defeatReason, setDefeatReason] = useState<string>('');

  // Audio state
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(KodoAudioManager.sfxEnabled);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(KodoAudioManager.musicEnabled);

  // Runtime metrics
  const [restartKey, setRestartKey] = useState<number>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [movesCount, setMovesCount] = useState<number>(0);
  const [raceRank, setRaceRank] = useState<number>(1);
  const [survivalAlive, setSurvivalAlive] = useState<number>(4);
  const [arenaResults, setArenaResults] = useState<ArenaPlacement[] | null>(null);
  const [victoryStars, setVictoryStars] = useState<number>(3);

  const timerIntervalRef = useRef<any>(null);
  const screenRef = useRef<'title' | 'playing' | 'paused' | 'gameover'>(screen);

  // Sync state machine to document.body.dataset.state
  useEffect(() => {
    screenRef.current = screen;
    document.body.dataset.state = screen;
  }, [screen]);

  // Autostart URL query parameter check
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      setScreen('playing');
      setCountdown(3);
    }
  }, []);

  // Three-second ready countdown before every new round or restart.
  useEffect(() => {
    if (screen !== 'playing' || countdown === null) return;
    const delay = countdown === 0 ? 650 : 1000;
    const timeout = window.setTimeout(() => {
      setCountdown((value) => value === null ? null : value === 0 ? null : value - 1);
    }, delay);
    return () => window.clearTimeout(timeout);
  }, [screen, countdown]);

  // Timer loop starts only after the countdown has finished.
  useEffect(() => {
    if (screen === 'playing' && countdown === null) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [screen, countdown]);

  // Format timer seconds into 0:00:00
  const formatTimer = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start Playing specific mode
  const handleStartGame = useCallback(
    (targetMode?: GameMode) => {
      if (targetMode) setMode(targetMode);
      setRestartKey((k) => k + 1);
      randomizeGameplayTheme();
      setShowModeSelect(false);
      setScreen('playing');
      setCountdown(3);
      setTimerSeconds(0);
      setMovesCount(0);
      setShowVictory(false);
      setShowDefeat(false);
      setArenaResults(null);
      KodoAudioManager.playHop();
      if (musicEnabled) {
        KodoAudioManager.startAmbientMusic();
      }
    },
    [musicEnabled]
  );

  // Global Keys (Enter/Space on title to open mode select, Esc/P to pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screen === 'title') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          setShowModeSelect(true);
        }
      } else if (screen === 'playing') {
        if (e.code === 'Escape' || e.code === 'KeyP') {
          e.preventDefault();
          setScreen('paused');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen]);

  // Restart current level/match
  const handleRestart = () => {
    setRestartKey((k) => k + 1);
    randomizeGameplayTheme();
    setTimerSeconds(0);
    setMovesCount(0);
    setShowVictory(false);
    setShowDefeat(false);
    setArenaResults(null);
    setScreen('playing');
    setCountdown(3);
    KodoAudioManager.playHop();
  };

  // Next Level in Campaign
  const handleNextLevel = () => {
    if (currentLevelIndex < CAMPAIGN_LEVELS.length - 1) {
      const nextIdx = currentLevelIndex + 1;
      setCurrentLevelIndex(nextIdx);
      if (nextIdx > unlockedLevel) {
        setUnlockedLevel(nextIdx);
        try {
          localStorage.setItem('kodo_unlocked', String(nextIdx));
        } catch {}
      }
      handleRestart();
    }
  };

  // Win Handler
  const handleWin = (stars: number, moves: number, timeSec: number) => {
    if (screenRef.current === 'title') return;
    setScreen('gameover');
    setVictoryStars(stars);
    setShowDefeat(false);
    setShowVictory(true);

    if (mode === 'campaign') {
      const lvl = CAMPAIGN_LEVELS[currentLevelIndex];
      const prevStars = levelStars[lvl.id] || 0;
      const updatedStars = { ...levelStars, [lvl.id]: Math.max(prevStars, stars) };
      setLevelStars(updatedStars);

      const prevBest = bestTimes[lvl.id];
      const updatedTimes = {
        ...bestTimes,
        [lvl.id]: prevBest ? Math.min(prevBest, timerSeconds) : timerSeconds,
      };
      setBestTimes(updatedTimes);

      try {
        localStorage.setItem('kodo_stars', JSON.stringify(updatedStars));
        localStorage.setItem('kodo_times', JSON.stringify(updatedTimes));
      } catch {}

      if (currentLevelIndex + 1 > unlockedLevel) {
        const nextUnlocked = Math.min(CAMPAIGN_LEVELS.length - 1, currentLevelIndex + 1);
        setUnlockedLevel(nextUnlocked);
        try {
          localStorage.setItem('kodo_unlocked', String(nextUnlocked));
        } catch {}
      }
    }
  };

  // Lose Handler
  const handleLose = (reason: string) => {
    if (screenRef.current === 'title') return;
    setScreen('gameover');
    setDefeatReason(reason);
    setShowVictory(false);
    setShowDefeat(true);

    if (mode === 'campaign') {
      const lvlId = CAMPAIGN_LEVELS[currentLevelIndex].id;
      setFailCounts((prev) => ({
        ...prev,
        [lvlId]: (prev[lvlId] || 0) + 1,
      }));
    }
  };

  // Return to Main Menu cleanly from any modal
  const handleMainMenu = () => {
    screenRef.current = 'title';
    setCountdown(null);
    setShowVictory(false);
    setShowDefeat(false);
    setArenaResults(null);
    setShowModeSelect(false);
    setShowLevelSelect(false);
    setScreen('title');
    KodoAudioManager.stopAmbientMusic();
  };

  // Reset Progress
  const handleResetProgress = () => {
    try {
      localStorage.removeItem('kodo_unlocked');
      localStorage.removeItem('kodo_stars');
      localStorage.removeItem('kodo_times');
    } catch {}
    setUnlockedLevel(0);
    setLevelStars({});
    setBestTimes({});
    setCurrentLevelIndex(0);
    setShowSettings(false);
  };

  const currentLevel = CAMPAIGN_LEVELS[currentLevelIndex];
  const activeBgImage =
    screen === 'title' ? MAIN_MENU_THEME.image : GAMEPLAY_THEMES[gameplayThemeIndex].image;

  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center bg-slate-950">
      {/* Background Wallpaper: Unique on Main Menu, Randomized during Gameplay */}
      <div className="absolute inset-0 z-0">
        <img
          src={activeBgImage}
          alt="Winter Wallpaper"
          className="w-full h-full object-cover filter brightness-85 contrast-105 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-radial from-transparent via-slate-950/40 to-slate-950/80 pointer-events-none" />
      </div>

      {/* Main Game Shell Frame */}
      <main className="relative z-10 w-full h-full max-w-md sm:max-w-lg md:max-w-xl flex flex-col items-center justify-between shadow-2xl overflow-hidden bg-slate-950/30 backdrop-blur-xs">
        {/* Screen 1: TITLE SCREEN */}
        {screen === 'title' && (
          <TitleScreen
            onPlay={() => setShowModeSelect(true)}
            onOpenLevels={() => setShowLevelSelect(true)}
            onOpenSettings={() => setShowSettings(true)}
          />
        )}

        {/* Screen 2: PLAYING VIEW */}
        {screen !== 'title' && (
          <div className="relative w-full h-full flex flex-col justify-between overflow-hidden">
            {/* Top HUD */}
            <HUD
              title={
                mode === 'campaign'
                  ? currentLevel.name
                  : mode === 'race'
                  ? `AI RACE · ${raceRank === 1 ? '1st' : raceRank === 2 ? '2nd' : raceRank === 3 ? '3rd' : '4th'} PLACE`
                  : mode === 'survival' ? `SURVIVAL · ${survivalAlive}/4 ALIVE` : 'EAT ALL ARENA · 8 PLAYERS'
              }
              timeFormatted={formatTimer(timerSeconds)}
              stars={mode === 'campaign' ? levelStars[currentLevel.id] || 3 : 3}
              onMove={(dir) => {
                if ((window as any).__KODO_MOVE__) {
                  (window as any).__KODO_MOVE__(dir);
                }
              }}
              onRestart={handleRestart}
              onNext={mode === 'campaign' ? handleNextLevel : undefined}
              onPause={() => setScreen('paused')}
              onOpenSettings={() => setShowSettings(true)}
              canNext={mode === 'campaign' && currentLevelIndex < CAMPAIGN_LEVELS.length - 1}
              extraBadge={
                mode === 'campaign'
                  ? `Moves: ${movesCount}`
                  : mode === 'race'
                  ? 'Speed'
                  : mode === 'survival'
                  ? 'Shrinking'
                  : 'Eat rivals'
              }
            />

            {/* Mode Gameplay Canvas */}
            <div className="relative w-full h-full flex items-center justify-center">
              {mode === 'campaign' && (
                <CampaignView
                  key={`campaign-${currentLevel.id}-${restartKey}`}
                  level={currentLevel}
                  isPaused={screen !== 'playing' || countdown !== null || showSettings || showLevelSelect || showModeSelect}
                  onWin={handleWin}
                  onLose={handleLose}
                  onMovesChange={setMovesCount}
                />
              )}
              {mode === 'race' && (
                <RaceView
                  key={`race-${restartKey}`}
                  isPaused={screen !== 'playing' || countdown !== null || showSettings || showLevelSelect || showModeSelect}
                  onWin={(place, _moves, winnerName) => {
                    if (place === 1) {
                      handleWin(3, 0, timerSeconds);
                    } else {
                      handleLose(`${winnerName || 'Frosty'} won the race!`);
                    }
                  }}
                  onRankChange={setRaceRank}
                />
              )}

              {mode === 'arena' && (
                <ArenaView
                  key={`arena-${restartKey}`}
                  isPaused={screen !== 'playing' || countdown !== null || showSettings || showLevelSelect || showModeSelect}
                  onComplete={(placements) => {
                    setArenaResults(placements);
                    setScreen('gameover');
                  }}
                />
              )}
              {mode === 'survival' && (
                <SurvivalView
                  key={`survival-${restartKey}`}
                  isPaused={screen !== 'playing' || countdown !== null || showSettings || showLevelSelect || showModeSelect}
                  onWin={(survivedSec) => handleWin(3, 0, survivedSec)}
                  onLose={handleLose}
                  onAliveCountChange={setSurvivalAlive}
                />
              )}
            </div>
          </div>
        )}

      {/* Ready countdown shown above every game mode */}
      {screen === 'playing' && countdown !== null && (
        <div className="absolute inset-x-0 top-5 z-40 flex justify-center pointer-events-none">
          <div className="flex flex-col items-center justify-center">
            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-sky-100/90 drop-shadow-[0_2px_5px_rgba(15,23,42,0.9)]">Get Ready</span>
            <span key={countdown} className="mt-0.5 text-4xl font-black tabular-nums leading-none text-white drop-shadow-[0_2px_10px_rgba(14,165,233,0.9)] animate-pulse">
              {countdown === 0 ? 'GO!' : countdown}
            </span>
          </div>
        </div>
      )}

        {/* MODE SELECT MODAL (Triggered when clicking Play on Title Screen) */}
        {showModeSelect && (
          <ModeSelectModal
            currentCampaignLevel={currentLevelIndex}
            unlockedLevel={unlockedLevel}
            totalLevels={CAMPAIGN_LEVELS.length}
            onSelectMode={(chosenMode) => handleStartGame(chosenMode)}
            onOpenLevelGrid={() => {
              setShowModeSelect(false);
              setShowLevelSelect(true);
            }}
            onClose={() => setShowModeSelect(false)}
          />
        )}

        {/* MODALS */}
        {showLevelSelect && (
          <LevelSelectModal
            unlockedLevel={unlockedLevel}
            levelStars={levelStars}
            bestTimes={bestTimes}
            onSelectLevel={(idx) => {
              if (idx > unlockedLevel) return;
              setCurrentLevelIndex(idx);
              setMode('campaign');
              setScreen('playing');
              handleRestart();
            }}
            onClose={() => setShowLevelSelect(false)}
          />
        )}

        {showSettings && (
          <SettingsModal
            sfxEnabled={sfxEnabled}
            musicEnabled={musicEnabled}
            onToggleSfx={() => {
              const next = !sfxEnabled;
              setSfxEnabled(next);
              KodoAudioManager.setSfx(next);
            }}
            onToggleMusic={() => {
              const next = !musicEnabled;
              setMusicEnabled(next);
              KodoAudioManager.setMusic(next);
            }}
            onResetProgress={handleResetProgress}
            onClose={() => setShowSettings(false)}
          />
        )}

        {screen === 'paused' && (
          <PauseModal
            onResume={() => setScreen('playing')}
            onRestart={handleRestart}
            onOpenLevels={mode === 'campaign' ? () => {
              setScreen('playing');
              setShowLevelSelect(true);
            } : undefined}
            onMainMenu={handleMainMenu}
          />
        )}


        {mode === 'arena' && arenaResults && (
          <ArenaResultsModal
            placements={arenaResults}
            onRetry={handleRestart}
            onMainMenu={handleMainMenu}
          />
        )}
        {showVictory && screen !== 'title' && (
          <VictoryModal
            title={mode === 'campaign' ? currentLevel.name : mode === 'race' ? 'AI Race Champion!' : 'Last Bird Standing!'}
            stars={victoryStars}
            moves={movesCount}
            parMoves={mode === 'campaign' ? currentLevel.parMoves : 15}
            timeSeconds={timerSeconds}
            modeName={mode}
            onNext={mode === 'campaign' ? handleNextLevel : handleRestart}
            onRestart={handleRestart}
            onMainMenu={handleMainMenu}
            hasNext={mode === 'campaign' && currentLevelIndex < CAMPAIGN_LEVELS.length - 1}
          />
        )}

        {showDefeat && screen !== 'title' && (
          <DefeatModal
            reason={defeatReason}
            attemptCount={failCounts[currentLevel.id] || 1}
            onRetry={handleRestart}
            onMainMenu={handleMainMenu}
          />
        )}
      </main>
    </div>
  );
}
