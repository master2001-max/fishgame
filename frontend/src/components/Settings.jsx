import React, { useState } from 'react';

export default function Settings({ onReturnHome }) {
  const [music, setMusic] = useState(true);
  const [sfx, setSfx] = useState(true);
  const [difficulty, setDifficulty] = useState('Easy');

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
          ⚙️ Hunter's Gear
        </h2>

        <div className="w-full bg-white/30 rounded-xl p-6 mb-6 shadow-sm flex flex-col gap-6">
          <div className="text-lg font-bold text-slate-900 border-b border-white/30 pb-2">Settings</div>

          <div className="flex flex-col gap-3">
            <span className="font-bold text-slate-900">Sound</span>
            <div className="flex justify-between items-center pl-4">
              <span className="text-slate-800">Music</span>
              <input 
                type="checkbox" 
                checked={music} 
                onChange={() => setMusic(!music)} 
                className="w-5 h-5 accent-blue-900 cursor-pointer"
              />
            </div>
            <div className="flex justify-between items-center pl-4">
              <span className="text-slate-800">SFX</span>
              <input 
                type="checkbox" 
                checked={sfx} 
                onChange={() => setSfx(!sfx)} 
                className="w-5 h-5 accent-blue-900 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-white/30 pt-4">
            <span className="font-bold text-slate-900">Difficulty</span>
            <select 
              value={difficulty} 
              onChange={(e) => setDifficulty(e.target.value)}
              className="bg-white/70 px-4 py-2 rounded-lg font-semibold text-slate-900 outline-none cursor-pointer"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        <p className="text-xs font-bold tracking-wider text-slate-900 opacity-80 uppercase">
          KEEP HUNTING, CLIMB THE RANKS.
        </p>

      </div>
    </div>
  );
} 