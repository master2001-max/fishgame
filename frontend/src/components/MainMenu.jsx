import {
  BrandCrest,
  LockIcon,
  LogoutIcon,
  PlayIcon,
  SlidersIcon,
  TrophyIcon,
} from './Icons';
import {
  DIFFICULTY_CONFIG,
  DIFFICULTY_ORDER,
  LEVELS_PER_DIFFICULTY,
  getLevelTargetMarks,
  normalizeDifficulty,
} from '../utils/gameConfig';
import { soundEngine } from '../utils/sound';

const DIFFICULTY_ACCENTS = {
  Easy: {
    active: 'bg-emerald-400/15 border-emerald-300/70 shadow-[0_0_20px_rgba(52,211,153,0.16)]',
    dot: 'bg-emerald-400',
    tag: 'text-emerald-300',
  },
  Normal: {
    active: 'bg-cyan-400/18 border-cyan-300/75 shadow-[0_0_20px_rgba(34,211,238,0.18)]',
    dot: 'bg-cyan-400',
    tag: 'text-cyan-300',
  },
  Hard: {
    active: 'bg-rose-400/15 border-rose-300/70 shadow-[0_0_20px_rgba(251,113,133,0.16)]',
    dot: 'bg-rose-400',
    tag: 'text-rose-300',
  },
};

function formatTime(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function MainMenu({
  user,
  stats,
  settings,
  currentLevel,
  progress,
  savedGame,
  onSelectDifficulty,
  onStartNewMission,
  onResumeSavedGame,
  onNavigate,
  onLogout,
}) {
  const displayName = user?.name || 'Hunter';
  const activeDifficulty = normalizeDifficulty(settings.difficulty);
  const completedInDiff = progress?.[activeDifficulty]?.completed || [];
  const targetMarks = getLevelTargetMarks(activeDifficulty, currentLevel);
  const allDiffCleared = completedInDiff.length >= LEVELS_PER_DIFFICULTY;

  const navigateWithSound = (dest) => {
    soundEngine.playClick();
    onNavigate(dest);
  };

  return (
    <div className="w-full max-w-[540px] mx-auto px-4 py-4 animate-modal-enter">
      <div className="glass-panel rounded-[28px] p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />

        {/* Header: Brand + Hunter + High Score + Sign Out */}
        <div className="flex items-center justify-between gap-3 pb-5 border-b border-cyan-200/10">
          <div className="flex items-center gap-3 min-w-0">
            <BrandCrest className="w-10 h-10 shrink-0 drop-shadow-[0_0_14px_rgba(34,211,238,0.4)]" />
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight text-white leading-tight">
                Fish Catcher
              </h1>
              <div className="text-xs text-cyan-300/85 font-medium truncate">
                {displayName} · High Score: {(stats?.bestScore || 0).toLocaleString()}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onLogout();
            }}
            className="btn-ocean-secondary h-9 px-3.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold shrink-0 cursor-pointer"
          >
            <LogoutIcon className="w-3.5 h-3.5 text-slate-300" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Difficulty Picker */}
        <div className="mt-5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-200/80 mb-2.5">
            Select Difficulty
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {DIFFICULTY_ORDER.map((diffKey) => {
              const meta = DIFFICULTY_CONFIG[diffKey];
              const accent = DIFFICULTY_ACCENTS[diffKey];
              const isSelected = activeDifficulty === diffKey;
              const diffProg = progress?.[diffKey] || { currentLevel: 1, completed: [] };
              const isDiffDone = (diffProg.completed || []).length >= LEVELS_PER_DIFFICULTY;

              return (
                <button
                  key={diffKey}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onSelectDifficulty(diffKey);
                  }}
                  className={`rounded-2xl p-3 text-left border transition-all cursor-pointer ${
                    isSelected
                      ? accent.active
                      : 'bg-slate-950/40 border-white/10 hover:border-cyan-300/35'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-sm font-extrabold text-white">
                      {diffKey}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSelected ? accent.dot : 'bg-slate-600'
                      }`}
                    />
                  </div>
                  <div className={`text-[11px] font-semibold ${accent.tag}`}>
                    {meta.timeLabel} · {meta.speedLabel}
                  </div>
                  <div className="text-[11px] text-slate-300/80 mt-0.5">
                    {isDiffDone
                      ? 'All 6 Levels Cleared'
                      : `Level ${diffProg.currentLevel} / ${LEVELS_PER_DIFFICULTY}`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sequential Level 1-6 Progress Track (Read-only, cannot skip levels) */}
        <div className="glass-subcard rounded-2xl p-3.5 mt-3.5">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="text-xs font-bold text-white">
              {activeDifficulty} · Level {currentLevel} / {LEVELS_PER_DIFFICULTY}
            </span>
            <span className="text-xs font-bold text-cyan-300 tabular-nums">
              Target: {targetMarks.toLocaleString()} Marks
            </span>
          </div>

          <div className="grid grid-cols-6 gap-1.5" aria-label="Sequential level progression">
            {Array.from({ length: LEVELS_PER_DIFFICULTY }, (_, idx) => {
              const lv = idx + 1;
              const isCurrent = currentLevel === lv;
              const isDone = completedInDiff.includes(lv);
              const isLocked = !isDone && lv > currentLevel;

              return (
                <div
                  key={lv}
                  title={
                    isDone
                      ? `Level ${lv} Completed`
                      : isCurrent
                      ? `Current Level ${lv}`
                      : `Level ${lv} Locked — complete Level ${lv - 1} first`
                  }
                  className={`h-9 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 border select-none ${
                    isCurrent
                      ? 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.4)]'
                      : isDone
                      ? 'bg-emerald-500/15 text-emerald-200 border-emerald-400/35'
                      : 'bg-slate-950/45 text-slate-500 border-white/10 opacity-75'
                  }`}
                >
                  <span>{lv}</span>
                  {isDone && !isCurrent && (
                    <span className="text-[10px] leading-none">✓</span>
                  )}
                  {isLocked && <LockIcon className="w-3 h-3" />}
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-400 mt-2">
            {allDiffCleared
              ? `${activeDifficulty} mode cleared! Replaying Level 6.`
              : 'Levels unlock sequentially from 1 to 6 as you complete each mission.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex flex-col gap-2.5">
          {savedGame ? (
            <>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onResumeSavedGame();
                }}
                className="btn-ocean-primary w-full py-3 px-4 rounded-2xl flex flex-col items-center justify-center gap-0.5 cursor-pointer"
              >
                <span className="flex items-center gap-2 text-sm sm:text-base font-extrabold">
                  <PlayIcon className="w-5 h-5" />
                  <span>Continue Where You Stopped</span>
                </span>
                <span className="text-[11px] font-semibold opacity-90">
                  {savedGame.difficulty} Lv. {savedGame.level} · Score:{' '}
                  {savedGame.score.toLocaleString()} · {formatTime(savedGame.timeLeft)} left
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onStartNewMission();
                }}
                className="btn-ocean-secondary w-full h-11 rounded-2xl flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold cursor-pointer"
              >
                <PlayIcon className="w-4 h-4 text-cyan-300" />
                <span>
                  Start Fresh ({activeDifficulty} Lv. {currentLevel})
                </span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onStartNewMission();
              }}
              className="btn-ocean-primary w-full h-12 rounded-2xl flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
            >
              <PlayIcon className="w-5 h-5" />
              <span>
                Start Mission ({activeDifficulty} Lv. {currentLevel})
              </span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => navigateWithSound('leaderboard')}
              className="btn-ocean-secondary h-11 rounded-2xl flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold cursor-pointer"
            >
              <TrophyIcon className="w-4 h-4 text-amber-300" />
              <span>Top Hunters</span>
            </button>

            <button
              type="button"
              onClick={() => navigateWithSound('settings')}
              className="btn-ocean-secondary h-11 rounded-2xl flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold cursor-pointer"
            >
              <SlidersIcon className="w-4 h-4 text-cyan-300" />
              <span>Hunter&apos;s Gear</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
