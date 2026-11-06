import React from 'react';

export default function MainMenu({ username, onNavigate, onLogout }) {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      {/* Outer Glass Card matching wireframe */}
      <div className="w-full max-w-[650px] bg-sky-400/45 backdrop-blur-md border border-sky-900/40 rounded-[28px] p-10 shadow-2xl flex flex-col items-center">
        
        <h1 className="text-5xl font-normal text-slate-900 font-serif mb-2">Fish Catcher</h1>
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Hunter's Hub</h2>

        {/* Displays logged-in Virtual Identity */}
        <div className="bg-white/40 px-5 py-1.5 rounded-full text-slate-900 font-semibold text-sm mb-8 shadow-sm">
          Hunter: <span className="text-blue-950 font-bold">{username}</span>
        </div>

        {/* Menu Buttons Stack */}
        <div className="flex flex-col gap-4 w-full items-center">
          
          <button 
            onClick={() => onNavigate('game')} 
            className="w-[290px] h-[50px] bg-sky-100 hover:bg-white text-slate-900 font-semibold rounded-full shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-3 text-lg"
          >
            🌊 Start Mission
          </button>

          <button 
            onClick={() => onNavigate('leaderboard')} 
            className="w-[290px] h-[50px] bg-sky-100 hover:bg-white text-slate-900 font-semibold rounded-full shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-3 text-lg"
          >
            🏆 Top Hunters
          </button>

          <button 
            onClick={() => onNavigate('settings')} 
            className="w-[290px] h-[50px] bg-sky-100 hover:bg-white text-slate-900 font-semibold rounded-full shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-3 text-lg"
          >
            ⚙️ Hunter's Gear
          </button>

          <button 
            onClick={onLogout} 
            className="w-[290px] h-[50px] bg-sky-100 hover:bg-white text-slate-900 font-semibold rounded-full shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-3 text-lg"
          >
            🚪 Return to Base
          </button>

        </div>

      </div>
    </div>
  );
}