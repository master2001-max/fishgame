import React from 'react';

export default function Leaderboard({ onReturnHome }) {
  const topHunters = [
    { rank: 1, name: 'Isuru', score: 3000 },
    { rank: 2, name: 'Ravindu', score: 2700 },
    { rank: 3, name: 'Pathum', score: 2670 },
    { rank: 4, name: 'Sehan', score: 2500 },
    { rank: 5, name: 'User123', score: 2100 },
  ];

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-[700px] bg-sky-400/45 backdrop-blur-md border border-sky-900/40 rounded-[28px] p-8 shadow-2xl flex flex-col items-center relative">
        
        <button 
          onClick={onReturnHome}
          className="absolute top-6 left-6 bg-white/50 hover:bg-white p-2 rounded-full shadow transition-all text-slate-900 font-bold text-sm flex items-center gap-1"
        >
          🏠 Hub
        </button>

        <h2 className="text-2xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
          🏆 Top Hunters
        </h2>

        <div className="w-full bg-white/30 rounded-xl overflow-hidden mb-6 shadow-sm">
          <div className="grid grid-cols-3 bg-blue-900/20 px-6 py-3 font-bold text-slate-900 text-sm">
            <span>RANK</span>
            <span>HUNTER</span>
            <span className="text-right">SCORE</span>
          </div>
          
          {topHunters.map((hunter) => (
            <div key={hunter.rank} className="grid grid-cols-3 px-6 py-3 border-t border-white/20 text-slate-900 font-medium">
              <span>{hunter.rank}</span>
              <span>{hunter.name}</span>
              <span className="text-right">{hunter.score}</span>
            </div>
          ))}
        </div>

        <div className="w-full bg-sky-900/10 rounded-xl p-4 mb-4">
          <div className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wide">Your Ranking</div>
          <div className="grid grid-cols-3 px-2 font-bold text-slate-900">
            <span>20</span>
            <span>Nimantha</span>
            <span className="text-right">900</span>
          </div>
        </div>

        <p className="text-xs font-bold tracking-wider text-slate-900 opacity-80 uppercase">
          KEEP HUNTING. CLIMB THE RANKS.
        </p>

      </div>
    </div>
  );
}