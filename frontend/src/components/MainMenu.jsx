import {
  AnchorHookIcon,
  BrandCrest,
  FishSpeciesIcon,
  LogoutIcon,
  PlayIcon,
  SlidersIcon,
  SparklesIcon,
  TrophyIcon,
} from './Icons';
import {
  DIFFICULTY_CONFIG,
  FISH_SPECIES,
  LURE_STYLES,
  getHunterRankTitle,
} from '../utils/gameConfig';
import { getRankedLeaderboard } from '../utils/storage';
import { soundEngine } from '../utils/sound';

const RARITY_STYLES = {
  Common: 'text-slate-300 bg-slate-500/15 border-slate-400/20',
  Uncommon: 'text-emerald-300 bg-emerald-500/15 border-emerald-400/25',
  Rare: 'text-violet-300 bg-violet-500/15 border-violet-400/30',
  Mythic: 'text-amber-300 bg-amber-500/15 border-amber-400/35',
};

export default function MainMenu({
  username,
  stats,
  settings,
  onNavigate,
  onLogout,
}) {
  const displayName = username || 'Guest Hunter';
  const initials = displayName.slice(0, 2).toUpperCase();
  const rankTitle = getHunterRankTitle(stats.bestScore);
  const difficultyMeta = DIFFICULTY_CONFIG[settings.difficulty] || DIFFICULTY_CONFIG.Easy;
  const lureMeta = LURE_STYLES[settings.lureStyle] || LURE_STYLES.biolum;
  const rankedBoard = getRankedLeaderboard(displayName, stats.bestScore);
  const currentStanding = rankedBoard.find((entry) => entry.isCurrentUser);

  const navigateWithSound = (dest) => {
    soundEngine.playClick();
    onNavigate(dest);
  };

  return (
    <div className="w-full max-w-[920px] mx-auto px-4 py-6 animate-modal-enter">
      <div className="glass-panel rounded-[30px] p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 inset-x-16 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />

        {/* Header: Brand + Hunter Profile + Logout */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-cyan-200/10">
          <div className="flex items-center gap-3.5">
            <BrandCrest className="w-11 h-11 drop-shadow-[0_0_14px_rgba(34,211,238,0.4)]" />
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300/80">
                Hunter&apos;s Hub
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Fish Catcher
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="glass-subcard rounded-2xl px-3.5 py-2 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 font-extrabold text-xs flex items-center justify-center shadow-inner">
                {initials}
              </div>
              <div className="leading-tight">
                <div className="text-sm font-bold text-white">{displayName}</div>
                <div className="text-[11px] font-semibold text-cyan-300/90">
                  {rankTitle}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onLogout();
              }}
              title="Return to Base"
              className="btn-ocean-secondary h-11 px-3.5 rounded-2xl flex items-center gap-2 text-xs font-semibold cursor-pointer"
            >
              <LogoutIcon className="w-4 h-4 text-slate-300" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Main Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-6">
          {/* Primary Launch Card */}
          <div className="lg:col-span-7 glass-subcard rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-cyan-400/15 blur-2xl group-hover:bg-cyan-400/25 transition-colors" />

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-400/15 border border-cyan-300/25 text-cyan-200 text-[11px] font-semibold uppercase tracking-wider mb-4">
                <SparklesIcon className="w-3.5 h-3.5" />
                <span>Ready for Deployment</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
                Deep-Sea Expedition
              </h2>
              <p className="text-sm text-slate-300/85 leading-relaxed max-w-md mb-5">
                Steer your vessel across sunlit waves, time your hook drops, chain combo catches, and snag glowing abyssal species before the clock runs down.
              </p>

              {/* Active Loadout Badges */}
              <div className="flex flex-wrap gap-2.5 mb-6">
                <div className="px-3 py-1.5 rounded-xl bg-slate-950/50 border border-cyan-300/15 text-xs flex items-center gap-2">
                  <span className="text-slate-400">Difficulty:</span>
                  <span className="font-bold text-cyan-300">
                    {settings.difficulty} ({difficultyMeta.badge})
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-slate-950/50 border border-cyan-300/15 text-xs flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: lureMeta.previewHex }}
                  />
                  <span className="text-slate-400">Lure:</span>
                  <span className="font-bold text-white">{lureMeta.name}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigateWithSound('game')}
              className="btn-ocean-primary w-full sm:w-auto px-7 h-13 rounded-2xl flex items-center justify-center gap-2.5 text-base cursor-pointer"
            >
              <PlayIcon className="w-5 h-5" />
              <span>Start Mission</span>
            </button>
          </div>

          {/* Right Column: Stats + Secondary Nav */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Mini Career Stats */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="glass-subcard rounded-2xl p-3.5 text-center">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Best Score
                </div>
                <div className="text-xl font-extrabold text-cyan-300 tabular-nums mt-0.5">
                  {stats.bestScore.toLocaleString()}
                </div>
              </div>
              <div className="glass-subcard rounded-2xl p-3.5 text-center">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Catches
                </div>
                <div className="text-xl font-extrabold text-white tabular-nums mt-0.5">
                  {stats.totalCatches}
                </div>
              </div>
              <div className="glass-subcard rounded-2xl p-3.5 text-center">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Rank
                </div>
                <div className="text-xl font-extrabold text-amber-300 tabular-nums mt-0.5">
                  #{currentStanding ? currentStanding.rank : '-'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigateWithSound('leaderboard')}
              className="glass-subcard hover:border-cyan-300/40 hover:bg-sky-900/35 rounded-2xl p-4 flex items-center justify-between transition-all cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-amber-400/15 border border-amber-300/25 text-amber-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <TrophyIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base font-bold text-white">Top Hunters</div>
                  <div className="text-xs text-slate-300/80">
                    Leader: {rankedBoard[0]?.name} ({rankedBoard[0]?.score.toLocaleString()} pts)
                  </div>
                </div>
              </div>
              <span className="text-cyan-300/70 group-hover:translate-x-0.5 transition-transform text-sm font-bold">
                View →
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigateWithSound('settings')}
              className="glass-subcard hover:border-cyan-300/40 hover:bg-sky-900/35 rounded-2xl p-4 flex items-center justify-between transition-all cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-cyan-400/15 border border-cyan-300/25 text-cyan-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <SlidersIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base font-bold text-white">Hunter&apos;s Gear</div>
                  <div className="text-xs text-slate-300/80">
                    Audio, difficulty &amp; hook lure style
                  </div>
                </div>
              </div>
              <span className="text-cyan-300/70 group-hover:translate-x-0.5 transition-transform text-sm font-bold">
                Tune →
              </span>
            </button>
          </div>
        </div>

        {/* Marine Field Guide Strip */}
        <div className="glass-subcard rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-200/90">
              <AnchorHookIcon className="w-4 h-4 text-cyan-300" />
              <span>Marine Target Field Guide</span>
            </div>
            <span className="text-[11px] text-slate-400">
              Chain catches without missing to build Combo Multipliers
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {FISH_SPECIES.map((fish) => (
              <div
                key={fish.id}
                className="rounded-xl bg-slate-950/45 border border-white/8 px-3 py-2.5 flex flex-col items-center text-center gap-1.5"
              >
                <FishSpeciesIcon
                  color={fish.color}
                  accentColor={fish.accentColor}
                  className="w-9 h-6"
                />
                <div className="text-xs font-semibold text-white leading-tight">
                  {fish.name}
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md border font-semibold ${
                      RARITY_STYLES[fish.rarity]
                    }`}
                  >
                    {fish.rarity}
                  </span>
                  <span className="text-[11px] font-bold text-cyan-300 tabular-nums">
                    +{fish.points}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
