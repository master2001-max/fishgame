import { ArrowLeftIcon, CrownIcon, TrophyIcon } from './Icons';
import { getRankedLeaderboard } from '../utils/storage';
import { soundEngine } from '../utils/sound';

const PODIUM_ACCENTS = {
  1: {
    ring: 'border-amber-300/45 bg-gradient-to-b from-amber-400/20 to-amber-950/20',
    badge: 'bg-amber-400 text-slate-950',
    score: 'text-amber-300',
  },
  2: {
    ring: 'border-slate-300/35 bg-gradient-to-b from-slate-300/15 to-slate-900/20',
    badge: 'bg-slate-200 text-slate-950',
    score: 'text-slate-200',
  },
  3: {
    ring: 'border-orange-400/35 bg-gradient-to-b from-orange-400/15 to-orange-950/20',
    badge: 'bg-orange-400 text-slate-950',
    score: 'text-orange-300',
  },
};

export default function Leaderboard({ username, stats, onReturnHome }) {
  const displayName = username || 'Guest Hunter';
  const entries = getRankedLeaderboard(displayName, stats.bestScore);
  const topThree = entries.slice(0, 3);
  const yourEntry = entries.find((e) => e.isCurrentUser);

  return (
    <div className="w-full max-w-[780px] mx-auto px-4 py-6 animate-modal-enter">
      <div className="glass-panel rounded-[30px] p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 inset-x-16 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />

        {/* Top Bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onReturnHome();
            }}
            className="btn-ocean-secondary h-10 px-4 rounded-xl flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Hunter&apos;s Hub</span>
          </button>

          <div className="flex items-center gap-2.5">
            <TrophyIcon className="w-6 h-6 text-amber-300" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Top Hunters
            </h2>
          </div>

          <div className="w-[110px] hidden sm:block" />
        </div>

        {/* Podium Cards for Top 3 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {topThree.map((hunter) => {
            const style = PODIUM_ACCENTS[hunter.rank];
            return (
              <div
                key={hunter.name}
                className={`rounded-2xl border p-4 flex flex-col items-center text-center relative ${style.ring} ${
                  hunter.isCurrentUser ? 'ring-2 ring-cyan-400/70' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs mb-2 shadow ${style.badge}`}
                >
                  {hunter.rank === 1 ? <CrownIcon className="w-4 h-4" /> : `#${hunter.rank}`}
                </div>
                <div className="font-bold text-white text-base truncate max-w-full">
                  {hunter.name}
                  {hunter.isCurrentUser && (
                    <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-200 font-semibold">
                      YOU
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-300/75 mb-2">{hunter.title}</div>
                <div className={`text-2xl font-extrabold tabular-nums ${style.score}`}>
                  {hunter.score.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Full Leaderboard Table */}
        <div className="glass-subcard rounded-2xl overflow-hidden mb-5">
          <div className="grid grid-cols-12 px-5 py-3 bg-cyan-950/45 border-b border-cyan-200/10 text-[11px] font-bold uppercase tracking-wider text-cyan-200/80">
            <span className="col-span-2">Rank</span>
            <span className="col-span-5">Hunter</span>
            <span className="col-span-3 hidden sm:block">Class</span>
            <span className="col-span-5 sm:col-span-2 text-right">Score</span>
          </div>

          <div className="divide-y divide-white/5">
            {entries.map((hunter) => (
              <div
                key={`${hunter.rank}-${hunter.name}`}
                className={`grid grid-cols-12 items-center px-5 py-3 text-sm transition-colors ${
                  hunter.isCurrentUser
                    ? 'bg-cyan-400/15 text-white font-semibold'
                    : 'text-slate-200 hover:bg-white/[0.03]'
                }`}
              >
                <span className="col-span-2 font-mono font-bold text-cyan-300">
                  #{hunter.rank}
                </span>
                <span className="col-span-5 flex items-center gap-2 truncate">
                  <span className="truncate">{hunter.name}</span>
                  {hunter.isCurrentUser && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-cyan-400/25 border border-cyan-300/35 text-cyan-100 font-bold">
                      YOU
                    </span>
                  )}
                </span>
                <span className="col-span-3 hidden sm:block text-xs text-slate-400">
                  {hunter.title}
                </span>
                <span className="col-span-5 sm:col-span-2 text-right font-mono font-bold tabular-nums text-white">
                  {hunter.score.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Personal Standing Summary */}
        {yourEntry && (
          <div className="rounded-2xl bg-gradient-to-r from-cyan-500/15 via-sky-500/10 to-teal-500/15 border border-cyan-300/25 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                Your Current Standing
              </div>
              <div className="text-sm text-slate-200 mt-0.5">
                Ranked <span className="font-bold text-white">#{yourEntry.rank}</span> as{' '}
                <span className="font-bold text-cyan-200">{yourEntry.name}</span> ·{' '}
                {yourEntry.title}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider text-slate-400">
                Personal Best
              </div>
              <div className="text-xl font-extrabold text-cyan-300 tabular-nums">
                {yourEntry.score.toLocaleString()} pts
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
