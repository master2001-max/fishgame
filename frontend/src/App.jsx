import { useCallback, useEffect, useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import MainMenu from './components/MainMenu';
import GameScreen from './components/GameScreen';
import Leaderboard from './components/Leaderboard';
import Settings from './components/Settings';
import OceanBackdrop from './components/OceanBackdrop';
import {
  loadSettings,
  loadStats,
  loadUser,
  recordGameStats,
  saveSettings,
  saveUser,
} from './utils/storage';
import { soundEngine } from './utils/sound';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => loadUser());
  const [currentScreen, setCurrentScreen] = useState(() =>
    loadUser() ? 'menu' : 'login'
  );
  const [settings, setSettings] = useState(() => loadSettings());
  const [stats, setStats] = useState(() => loadStats());
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
    setCurrentScreen(destination);
  };

  const handleUpdateSettings = useCallback(
    (nextSettings) => {
      unlockAudioIfNeeded();
      setSettings(nextSettings);
      saveSettings(nextSettings);
    },
    [unlockAudioIfNeeded]
  );

  const handleMissionComplete = useCallback((summary) => {
    const result = recordGameStats(summary);
    setStats(result.stats);
    return result;
  }, []);

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
            stats={stats}
            settings={settings}
            onNavigate={handleNavigation}
            onLogout={handleLogout}
          />
        )}

        {currentScreen === 'game' && (
          <GameScreen
            settings={settings}
            bestScore={stats.bestScore}
            onUpdateSettings={handleUpdateSettings}
            onMissionComplete={handleMissionComplete}
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
