import React, { useState } from 'react';

export default function GameScreen({ onReturnHome }) {
  const [showApiPopup, setShowApiPopup] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleApiSubmit = (e) => {
    e.preventDefault();
    if (userAnswer === '6') {
      setFeedback('Correct! Level Up! 🌊');
      setTimeout(() => {
        setShowApiPopup(false);
        setUserAnswer('');
        setFeedback('');
      }, 1500);
    } else {
      setFeedback('Incorrect! Try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-[900px] h-[600px] bg-sky-400/45 backdrop-blur-md border border-sky-900/40 rounded-[28px] p-6 shadow-2xl flex flex-col justify-between relative">
        
        {/* HUD Top Bar */}
        <div className="flex justify-between items-center bg-white/40 px-6 py-3 rounded-full shadow-sm">
          <button 
            onClick={onReturnHome}
            className="bg-white/70 hover:bg-white px-3 py-1 rounded-full text-xs font-bold text-slate-900"
          >
            ⏸ Pause
          </button>
          <div className="font-bold text-slate-900">Score - 000</div>
          <div className="font-bold text-slate-900">Time - 00:00</div>
          <div className="font-bold text-slate-900">Level - 001</div>
        </div>

        {/* Gameplay Area */}
        <div className="flex-1 my-4 bg-blue-950/20 rounded-2xl border border-white/20 flex flex-col items-center justify-center relative overflow-hidden">
          <p className="text-slate-900 font-semibold mb-4">🌊 [ 2D Canvas Fish Catching Game Area ]</p>
          <button 
            onClick={() => setShowApiPopup(true)}
            className="bg-sky-200 hover:bg-white px-6 py-2.5 rounded-full font-bold text-slate-900 shadow-md transition-all"
          >
            Trigger Fish API Popup Challenge
          </button>
        </div>

        {/* API Popup Modal Overlay */}
        {showApiPopup && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-[28px] flex items-center justify-center p-6">
            <div className="bg-sky-200/95 border border-sky-900 p-6 rounded-2xl w-full max-w-[500px] flex flex-col items-center shadow-2xl">
              
              <div className="text-sm font-bold text-slate-900 mb-3">Bonus Mission: API Interoperability</div>
              
              <div className="w-full h-44 bg-blue-900/30 rounded-lg mb-4 flex items-center justify-center border border-sky-900/20">
                <span className="text-xs text-slate-800">[ Marc Conrad Fish API Image Placeholder ]</span>
              </div>

              <form onSubmit={handleApiSubmit} className="w-full flex flex-col items-center gap-3">
                <label className="text-sm font-bold text-slate-900 text-center">
                  Enter the number of fish in the picture:
                </label>
                <input 
                  type="number" 
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  required
                  placeholder="e.g. 6"
                  className="w-24 h-10 text-center bg-white rounded-lg font-bold text-slate-900 outline-none"
                />
                
                {feedback && <p className="text-sm font-bold text-blue-950">{feedback}</p>}

                <div className="flex gap-3 mt-2">
                  <button type="submit" className="bg-sky-400 hover:bg-sky-500 px-6 py-2 rounded-full font-bold text-slate-900 shadow">
                    Submit Answer
                  </button>
                  <button type="button" onClick={() => setShowApiPopup(false)} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-full font-bold text-slate-800">
                    Close
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}