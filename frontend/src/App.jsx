import { useCallback, useEffect, useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import MainMenu from './components/MainMenu';
import GameScreen from './components/GameScreen';
import Leaderboard from './components/Leaderboard';
import Settings from './components/Settings';
import OceanBackdrop from './components/OceanBackdrop';
import {
  getNextIncompleteLevel,
  loadProgress,
  loadSettings,
  loadStats,
  loadUser,
  markLevelCompleted,
  recordGameStats,
  saveSettings,
  saveUser,
} from './utils/storage';
import { getNextStage, normalizeDifficulty } from './utils/gameConfig';
import { soundEngine } from './utils/sound';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => loadUser());
  const [currentScreen, setCurrentScreen] = useState(() =>
    loadUser() ? 'menu' : 'login'
  );
  const [settings, setSettings] = useState(() => loadSettings());
  const [stats, setStats] = useState(() => loadStats());
  const [progress, setProgress] = useState(() => loadProgress());
  const [selectedLevel, setSelectedLevel] = useState(() =>
    getNextIncompleteLevel(loadProgress(), loadSettings().difficulty)
  );
  const [activeStage, setActiveStage] = useState(() => ({
    difficulty: loadSettings().difficulty,
    level: getNextIncompleteLevel(loadProgress(), loadSettings().difficulty),
  }));
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // Sync audio preferences
  useEffect(() => {
    soundEngine.setSfxEnabled(settings.sfx);
    if (audioUnlocked) {
      soundEngine.setMusicEnabled(settings.music);
    }
  }, [settings.sfx, settings.music, audioUnlocked]);

  const unlockAudioIfNeeded = useCallback(() => {
    if (!audioUnlocked) {
      setAudioUnlocked(true);
      soundEngine.setSfxEnabled(settings.sfx);
      soundEngine.setMusicEnabled(settings.music);
    }
  }, [audioUnlocked, settings.music, settings.sfx]);

  const handleAuthSuccess = (username) => {
    unlockAudioIfNeeded();
    saveUser(username);
    setCurrentUser(username);
    setCurrentScreen('menu');
  };

  const handleLogout = () => {
    saveUser('');
    setCurrentUser('');
    setCurrentScreen('login');
  };

  const handleNavigation = (destination) => {
    unlockAudioIfNeeded();
    if (destination === 'game') {
      setActiveStage({
        difficulty: normalizeDifficulty(settings.difficulty),
        level: selectedLevel,
      });
    }
    setCurrentScreen(destination);
  };

  const handleUpdateSettings = useCallback(
    (nextSettings) => {
      unlockAudioIfNeeded();
      const prevDiff = normalizeDifficulty(settings.difficulty);
      const nextDiff = normalizeDifficulty(nextSettings.difficulty);
      const normalized = { ...nextSettings, difficulty: nextDiff };
      setSettings(normalized);
      saveSettings(normalized);
      if (nextDiff !== prevDiff) {
        setSelectedLevel(getNextIncompleteLevel(progress, nextDiff));
      }
    },
    [progress, settings.difficulty, unlockAudioIfNeeded]
  );

  const handleSelectDifficulty = useCallback(
    (difficulty) => {
      unlockAudioIfNeeded();
      const nextDiff = normalizeDifficulty(difficulty);
      const nextSettings = { ...settings, difficulty: nextDiff };
      setSettings(nextSettings);
      saveSettings(nextSettings);
      setSelectedLevel(getNextIncompleteLevel(progress, nextDiff));
    },
    [progress, settings, unlockAudioIfNeeded]
  );

  const handleMissionComplete = useCallback(
    ({ difficulty, level, score, catches, won }) => {
      const result = recordGameStats({ score, catches });
      setStats(result.stats);

      if (won) {
        const nextProgress = markLevelCompleted(difficulty, level);
        setProgress(nextProgress);

        const next = getNextStage(difficulty, level);
        if (next) {
          setSettings((prev) => {
            const updated = { ...prev, difficulty: next.difficulty };
            saveSettings(updated);
            return updated;
          });
          setSelectedLevel(next.level);
        }
      }

      return result;
    },
    []
  );

  const handleAdvanceStage = useCallback((nextStage) => {
    const nextDiff = normalizeDifficulty(nextStage.difficulty);
    setSettings((prev) => {
      const updated = { ...prev, difficulty: nextDiff };
      saveSettings(updated);
      return updated;
    });
    setSelectedLevel(nextStage.level);
    setActiveStage({ difficulty: nextDiff, level: nextStage.level });
  }, []);

  const gameSettings = {
    ...settings,
    difficulty: activeStage.difficulty,
  };

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden flex items-center justify-center">
      <OceanBackdrop />

      <div className="relative z-10 w-full flex items-center justify-center py-2">
        {currentScreen === 'login' && (
          <Login
            onLoginSuccess={handleAuthSuccess}
            onSwitchToRegister={() => setCurrentScreen('register')}
          />
        )}

        {currentScreen === 'register' && (
          <Register
            onRegisterSuccess={handleAuthSuccess}
            onSwitchToLogin={() => setCurrentScreen('login')}
          />
        )}

        {currentScreen === 'menu' && (
          <MainMenu
            username={currentUser}
            settings={settings}
            selectedLevel={selectedLevel}
            progress={progress}
            onSelectDifficulty={handleSelectDifficulty}
            onSelectLevel={setSelectedLevel}
            onNavigate={handleNavigation}
            onLogout={handleLogout}
          />
        )}

        {currentScreen === 'game' && (
          <GameScreen
            key={`${activeStage.difficulty}-${activeStage.level}`}
            settings={gameSettings}
            level={activeStage.level}
            bestScore={stats.bestScore}
            onUpdateSettings={handleUpdateSettings}
            onMissionComplete={handleMissionComplete}
            onAdvanceStage={handleAdvanceStage}
            onReturnHome={() => setCurrentScreen('menu')}
            onOpenLeaderboard={() => setCurrentScreen('leaderboard')}
          />
        )}

        {currentScreen === 'leaderboard' && (
          <Leaderboard
            username={currentUser}
            stats={stats}
            onReturnHome={() => setCurrentScreen('menu')}
          />
        )}

        {currentScreen === 'settings' && (
          <Settings
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onReturnHome={() => setCurrentScreen('menu')}
          />
        )}
      </div>
    </main>
  );
}
