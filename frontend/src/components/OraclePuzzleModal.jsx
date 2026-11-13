/**
 * Oracle Puzzle Modal (Third-Party Web Service Interoperability)
 *
 * Location: frontend/src/components/OraclePuzzleModal.jsx
 * Where it fits: Interactive UI Component. Triggered when hooking the Golden Oracle Fish
 * or when qualifying for level progression.
 *
 * Why: Interoperates with Dr. Marc Conrad's Fish Game API (https://marcconrad.com/uob/fish/).
 * Handles user guess events, async validation, and score bonus/penalty dispatching.
 */

import { useEffect, useState } from 'react';
import { gameApi } from '../utils/api';
import { soundEngine } from '../utils/sound';
import { SparklesIcon, TrophyIcon } from './Icons';

export default function OraclePuzzleModal({ isOpen, onClose, onPuzzleSuccess, onPuzzleFail }) {
  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Fetch puzzle from Marc Conrad Fish API via our Express endpoint
  useEffect(() => {
    if (!isOpen) {
      setChallenge(null);
      setUserAnswer('');
      setResult(null);
      setError('');
      return;
    }

    let active = true;
    setLoading(true);
    setError('');
    setResult(null);

    gameApi
      .getPuzzleChallenge()
      .then((data) => {
        if (active) {
          setChallenge(data);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Failed to connect to Oracle challenge.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!challenge || userAnswer === '' || verifying) return;

    setVerifying(true);
    setError('');

    try {
      soundEngine.playClick();
      const verification = await gameApi.verifyPuzzle({
        puzzleId: challenge.puzzleId,
        answer: Number(userAnswer),
      });

      setResult(verification);

      if (verification.correct) {
        soundEngine.playLevelUp?.() || soundEngine.playCatch?.('biolume');
        if (onPuzzleSuccess) {
          onPuzzleSuccess(verification.bonusMarks);
        }
      } else {
        soundEngine.playZap?.();
        if (onPuzzleFail) {
          onPuzzleFail(verification.penaltyMarks || 500);
        }
      }
    } catch (err) {
      setError(err.message || 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-[500px] rounded-[28px] p-6 sm:p-7 relative overflow-hidden border border-amber-400/40 shadow-[0_0_40px_rgba(251,191,36,0.3)] animate-modal-enter">
        {/* Top Glow Accent */}
        <div className="absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />

        {/* Clean Header */}
        <div className="flex items-center justify-center gap-2.5 mb-1.5">
          <div className="p-2 rounded-xl bg-amber-400/20 border border-amber-400/40 shadow-[0_0_12px_rgba(251,191,36,0.5)]">
            <SparklesIcon className="w-5 h-5 text-amber-300" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Golden Oracle Challenge
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-amber-200/90 font-medium text-center mb-4">
          To continue and claim <strong className="text-amber-300">+1,500 bonus marks</strong>, give the correct answer!
        </p>

        {loading ? (
          <div className="py-10 flex flex-col items-center justify-center gap-3">
            <div className="w-9 h-9 border-3 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
            <span className="text-xs text-amber-200/80 font-medium">
              Summoning Oracle Riddle...
            </span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs text-center mb-4">
            {error}
          </div>
        ) : challenge ? (
          <div className="flex flex-col items-center">
            {/* Aquarium Viewport */}
            <div className="relative w-full max-w-[400px] rounded-2xl overflow-hidden border-2 border-cyan-400/40 shadow-[inset_0_0_20px_rgba(34,211,238,0.35)] mb-4 bg-gradient-to-b from-sky-700 via-sky-900 to-slate-950 p-2 flex items-center justify-center">
              <img
                src={challenge.imageUrl}
                alt="Fish Counting Riddle"
                className="max-h-[190px] w-auto rounded-xl object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
              />
            </div>

            {/* Result Feedback */}
            {result ? (
              <div
                className={`w-full p-3.5 rounded-2xl border text-center mb-3 animate-scale-in ${
                  result.correct
                    ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
                    : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                }`}
              >
                <div className="text-sm font-black mb-0.5">
                  {result.correct ? '🎉 Riddle Solved!' : '❌ Incorrect Riddle Answer!'}
                </div>
                <div className="text-xs opacity-90">{result.message}</div>
                {result.correct ? (
                  <div className="mt-1.5 text-xs font-bold text-amber-300 flex items-center justify-center gap-1">
                    <TrophyIcon className="w-4 h-4" /> +{result.bonusMarks} Legendary Marks Added
                  </div>
                ) : (
                  <div className="mt-1.5 text-xs font-bold text-rose-300">
                    ⚠️ -{result.penaltyMarks || 500} Penalty Marks Deducted
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-2.5">
                <label className="text-xs text-cyan-200 font-semibold text-center">
                  How many fish are in the picture? (0 - 9)
                </label>
                <div className="flex gap-2 w-full max-w-[280px]">
                  <input
                    type="number"
                    min="0"
                    max="9"
                    step="1"
                    required
                    autoFocus
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Count"
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/80 border border-cyan-400/30 text-white text-center text-lg font-bold placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                  />
                  <button
                    type="submit"
                    disabled={verifying || userAnswer === ''}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm tracking-wide shadow-[0_0_15px_rgba(251,191,36,0.4)] disabled:opacity-50 transition-all cursor-pointer whitespace-nowrap"
                  >
                    {verifying ? 'Checking...' : 'Submit'}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : null}

        {/* Action Button */}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 transition-all cursor-pointer"
          >
            {result ? 'Resume Fishing' : 'Dismiss & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
