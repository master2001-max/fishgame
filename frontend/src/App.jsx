import { useCallback, useEffect, useMemo, useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import MainMenu from './components/MainMenu';
import GameScreen from './components/GameScreen';
import Leaderboard from './components/Leaderboard';
import Settings from './components/Settings';
import OceanBackdrop from './components/OceanBackdrop';
import { authApi, gameApi } from './utils/api';
import {
  clearAuthToken,
  clearLegacyTempData,
  getAuthToken,
} from './utils/storage';
import { normalizeDifficulty } from './utils/gameConfig';
import { soundEngine } from './utils/sound';

const PUBLIC_SCREENS = new Set(['login', 'register']);
const PROTECTED_SCREENS = new Set(['menu', 'game', 'leaderboard', 'settings']);

function pathToScreen(pathname) {
  const clean = (pathname || '/').replace(/\/+$/, '') || '/';
  const name = clean.slice(1);
  if (PUBLIC_SCREENS.has(name) || PROTECTED_SCREENS.has(name)) {
    return name;
  }
  return '';
}

function screenToPath(screen) {
  return `/${screen}`;
}

export default function App() {
  const [authChecking, setAuthChecking] = useState(() => Boolean(getAuthToken()));
  const [appState, setAppState] = useState(null);
  const [currentScreen, setCurrentScreen] = useState(() => {
    const initial = pathToScreen(window.location.pathname);
    return initial === 'register' ? 'register' : 'login';
  });
  const [activeStage, setActiveStage] = useState({ difficulty: 'Easy', level: 1 });
  const [resumeSession, setResumeSession] = useState(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const navigate = useCallback((targetScreen, { replace = false, authenticated = false } = {}) => {
    const allowed = authenticated
      ? PROTECTED_SCREENS.has(targetScreen)
        ? targetScreen
        : 'menu'
      : PUBLIC_SCREENS.has(targetScreen)
      ? targetScreen
      : 'login';

    const nextPath = screenToPath(allowed);
    if (window.location.pathname !== nextPath) {
      if (replace) {
        window.history.replaceState(null, '', nextPath);
      } else {
        window.history.pushState(null, '', nextPath);
      }
    }
    setCurrentScreen(allowed);
  }, []);

  // Verify session on startup and wipe any legacy temp data
  useEffect(() => {
    clearLegacyTempData();
    const token = getAuthToken();
    const requested = pathToScreen(window.location.pathname);

    if (!token) {
      const target = requested === 'register' ? 'register' : 'login';
      const targetPath = screenToPath(target);
      if (window.location.pathname !== targetPath) {
        window.history.replaceState(null, '', targetPath);
      }
      return;
    }

    authApi
      .me()
      .then((data) => {
        setAppState(data.state);
        const target = PROTECTED_SCREENS.has(requested) && requested !== 'game'
          ? requested
          : 'menu';
        navigate(target, { replace: true, authenticated: true });
      })
      .catch(() => {
        clearAuthToken();
        setAppState(null);
        navigate('login', { replace: true, authenticated: false });
      })
      .finally(() => {
        setAuthChecking(false);
      });
  }, [navigate]);

  // Block direct URL navigation / browser Back-Forward when unauthenticated
  useEffect(() => {
    const handlePopState = () => {
      const requested = pathToScreen(window.location.pathname);
      const isAuthed = Boolean(appState?.user);

      if (!isAuthed) {
        navigate(requested === 'register' ? 'register' : 'login', {
          replace: true,
          authenticated: false,
        });
        return;
      }

      if (requested === 'game' && !activeStage) {
        navigate('menu', { replace: true, authenticated: true });
        return;
      }

      navigate(PROTECTED_SCREENS.has(requested) ? requested : 'menu', {
        replace: true,
        authenticated: true,
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [appState, activeStage, navigate]);

  const settings = useMemo(
    () =>
      appState?.settings || {
        music: true,
        sfx: true,
        difficulty: 'Easy',
        lureStyle: 'biolum',
      },
    [appState?.settings]
  );

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

  const handleAuthSuccess = (state) => {
    unlockAudioIfNeeded();
    setAppState(state);
    setResumeSession(null);
    navigate('menu', { replace: true, authenticated: true });
  };

  const handleLogout = () => {
    clearAuthToken();
    setAppState(null);
    setResumeSession(null);
    navigate('login', { replace: true, authenticated: false });
  };

  const handleNavigation = (destination) => {
    if (!appState?.user) {
      navigate('login', { replace: true, authenticated: false });
      return;
    }
    unlockAudioIfNeeded();
    navigate(destination, { authenticated: true });
  };

  const handleUpdateSettings = useCallback(
    async (nextSettings) => {
      if (!appState?.user) return;
      unlockAudioIfNeeded();
      const normalized = {
        ...nextSettings,
        difficulty: normalizeDifficulty(nextSettings.difficulty),
      };
      setAppState((prev) => (prev ? { ...prev, settings: normalized } : prev));
      try {
        const data = await gameApi.updateSettings(normalized);
        setAppState(data.state);
      } catch {
        // Keep optimistic UI state on transient failure
      }
    },
    [appState?.user, unlockAudioIfNeeded]
  );

  const handleSelectDifficulty = useCallback(
    async (difficulty) => {
      if (!appState?.user) return;
      unlockAudioIfNeeded();
      const nextDiff = normalizeDifficulty(difficulty);
      const nextSettings = { ...settings, difficulty: nextDiff };
      setAppState((prev) => (prev ? { ...prev, settings: nextSettings } : prev));
      try {
        const data = await gameApi.updateSettings(nextSettings);
        setAppState(data.state);
      } catch {
        // Ignore transient network error
      }
    },
    [appState?.user, settings, unlockAudioIfNeeded]
  );

  const activeDifficulty = normalizeDifficulty(settings.difficulty);
  const currentSequentialLevel =
    appState?.progress?.[activeDifficulty]?.currentLevel || 1;

  const handleStartNewMission = async () => {
    if (!appState?.user) return;
    unlockAudioIfNeeded();
    if (appState.savedGame) {
      try {
        const data = await gameApi.clearSession();
        setAppState(data.state);
      } catch {
        // Proceed even if clear fails
      }
    }
    setResumeSession(null);
    setActiveStage({
      difficulty: activeDifficulty,
      level: currentSequentialLevel,
    });
    navigate('game', { authenticated: true });
  };

  const handleResumeSavedGame = () => {
    if (!appState?.user || !appState.savedGame) return;
    unlockAudioIfNeeded();
    const saved = appState.savedGame;
    setResumeSession(saved);
    setActiveStage({
      difficulty: normalizeDifficulty(saved.difficulty),
      level: saved.level,
    });
    navigate('game', { authenticated: true });
  };

  const handleSaveProgress = useCallback(async (snapshot, options) => {
    try {
      const data = await gameApi.saveSession(snapshot, options);
      if (!options?.keepalive) {
        setAppState(data.state);
      }
    } catch {
      // Ignore background save error
    }
  }, []);

  const handleSaveAndExit = useCallback(
    async (snapshot) => {
      try {
        const data = await gameApi.saveSession(snapshot);
        setAppState(data.state);
      } catch {
        // Still return to menu if offline
      }
      setResumeSession(null);
      navigate('menu', { authenticated: true });
    },
    [navigate]
  );

  const handleMissionComplete = useCallback(
    async ({ difficulty, level, score, catches, won }) => {
      const data = await gameApi.completeMission({
        difficulty,
        level,
        score,
        catches,
        won,
      });
      setAppState(data.state);
      return {
        stats: data.state.stats,
        isNewHighScore: data.isNewHighScore,
      };
    },
    []
  );

  const handleAdvanceStage = useCallback(async (nextStage) => {
    const nextDiff = normalizeDifficulty(nextStage.difficulty);
    setResumeSession(null);
    setActiveStage({ difficulty: nextDiff, level: nextStage.level });
    try {
      const data = await gameApi.updateSettings({
        ...settings,
        difficulty: nextDiff,
      });
      setAppState(data.state);
    } catch {
      // Ignore transient error
    }
  }, [settings]);

  const isAuthenticated = Boolean(appState?.user);

  const gameSettings = {
    ...settings,
    difficulty: activeStage.difficulty,
  };

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden flex items-center justify-center">
      <OceanBackdrop />

      <div className="relative z-10 w-full flex items-center justify-center py-2">
        {authChecking ? (
          <div className="glass-panel rounded-2xl px-8 py-6 text-sm text-cyan-200 font-semibold">
            Verifying hunter credentials...
          </div>
        ) : !isAuthenticated ? (
          currentScreen === 'register' ? (
            <Register
              onRegisterSuccess={handleAuthSuccess}
              onSwitchToLogin={() => navigate('login', { authenticated: false })}
            />
          ) : (
            <Login
              onLoginSuccess={handleAuthSuccess}
              onSwitchToRegister={() => navigate('register', { authenticated: false })}
            />
          )
        ) : (
          <>
            {currentScreen === 'menu' && (
              <MainMenu
                user={appState.user}
                stats={appState.stats}
                settings={settings}
                currentLevel={currentSequentialLevel}
                progress={appState.progress}
                savedGame={appState.savedGame}
                onSelectDifficulty={handleSelectDifficulty}
                onStartNewMission={handleStartNewMission}
                onResumeSavedGame={handleResumeSavedGame}
                onNavigate={handleNavigation}
                onLogout={handleLogout}
              />
            )}

            {currentScreen === 'game' && (
              <GameScreen
                key={`${activeStage.difficulty}-${activeStage.level}-${resumeSession ? 'resumed' : 'fresh'}`}
                settings={gameSettings}
                level={activeStage.level}
                bestScore={appState.stats.bestScore}
                resumeSession={resumeSession}
                onUpdateSettings={handleUpdateSettings}
                onMissionComplete={handleMissionComplete}
                onSaveProgress={handleSaveProgress}
                onSaveAndExit={handleSaveAndExit}
                onAdvanceStage={handleAdvanceStage}
                onReturnHome={() => {
                  setResumeSession(null);
                  navigate('menu', { authenticated: true });
                }}
                onOpenLeaderboard={() => {
                  setResumeSession(null);
                  navigate('leaderboard', { authenticated: true });
                }}
              />
            )}

            {currentScreen === 'leaderboard' && (
              <Leaderboard
                onReturnHome={() => navigate('menu', { authenticated: true })}
              />
            )}

            {currentScreen === 'settings' && (
              <Settings
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onReturnHome={() => navigate('menu', { authenticated: true })}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}
