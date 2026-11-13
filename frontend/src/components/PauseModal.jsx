import { useState } from 'react';
import {
  ArrowLeftIcon,
  LogoutIcon,
  PauseIcon,
  PlayIcon,
  SlidersIcon,
  SparklesIcon,
} from './Icons';
import { LURE_STYLES } from '../utils/gameConfig';
import { soundEngine } from '../utils/sound';

export default function PauseModal({
  onResume,
  onNewGame,
  onOpenSettings,
  onReturnHome,
  settings,
  onUpdateSettings,
}) {
  const [showQuickGear, setShowQuickGear] = useState(false);

  const handleOpenGear = () => {
    soundEngine.playClick();
    if (settings && onUpdateSettings) {
      setShowQuickGear(true);
    } else if (onOpenSettings) {
      onOpenSettings();
    }
  };

  return (
    <div className="absolute inset-0 bg-[#020b18]/75 backdrop-blur-md rounded-[28px] flex items-center justify-center p-4 z-30">
      <div className="glass-panel rounded-3xl p-7 w-full max-w-[410px] flex flex-col items-center text-center relative animate-modal-enter">
        <div className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />

        {!showQuickGear ? (
          <>
            <div className="w-12 h-12 rounded-2xl bg-cyan-400/15 border border-cyan-300/30 text-cyan-300 flex items-center justify-center mb-3">
              <PauseIcon className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-1">Mission Paused</h2>
            <p className="text-xs text-slate-400 mb-6">
              Take a breather or adjust your rig before diving back in.
            </p>

            <div className="flex flex-col gap-3 w-full">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onResume();
                }}
                className="btn-ocean-primary w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <PlayIcon className="w-4 h-4" />
                <span>Resume Mission</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onNewGame();
                }}
                className="btn-ocean-secondary w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold cursor-pointer"
              >
                <SparklesIcon className="w-4 h-4 text-cyan-300" />
                <span>Restart Mission</span>
              </button>

              <button
                type="button"
                onClick={handleOpenGear}
                className="btn-ocean-secondary w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold cursor-pointer"
              >
                <SlidersIcon className="w-4 h-4 text-cyan-300" />
                <span>Hunter&apos;s Gear</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onReturnHome();
                }}
                className="w-full h-11 rounded-xl border border-rose-400/25 bg-rose-500/10 hover:bg-rose-500/20 text-rose-200 font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogoutIcon className="w-4 h-4" />
                <span>Save &amp; Return to Hub</span>
              </button>
            </div>
          </>
        ) : (
          <div className="w-full text-left">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setShowQuickGear(false);
                }}
                className="btn-ocean-secondary h-8 px-3 rounded-lg flex items-center gap-1 text-xs font-semibold cursor-pointer"
              >
                <ArrowLeftIcon className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <h3 className="text-base font-extrabold text-white">Quick Gear</h3>
              <div className="w-14" />
            </div>

            <div className="flex flex-col gap-3 mb-5">
              <div className="glass-subcard rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">Ambient Music</span>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onUpdateSettings({ ...settings, music: !settings.music });
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    settings.music
                      ? 'bg-cyan-400 text-slate-950'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {settings.music ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="glass-subcard rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">Sound Effects</span>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onUpdateSettings({ ...settings, sfx: !settings.sfx });
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    settings.sfx
                      ? 'bg-cyan-400 text-slate-950'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {settings.sfx ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="glass-subcard rounded-xl p-3">
                <div className="text-xs font-semibold text-slate-200 mb-2">Lure Rig</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {Object.values(LURE_STYLES).map((lure) => (
                    <button
                      key={lure.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        onUpdateSettings({ ...settings, lureStyle: lure.id });
                      }}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        settings.lureStyle === lure.id
                          ? 'bg-cyan-400 text-slate-950'
                          : 'bg-slate-900/70 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: lure.previewHex }}
                      />
                      <span className="truncate">{lure.name.split(' ')[1]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setShowQuickGear(false);
                onResume();
              }}
              className="btn-ocean-primary w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <PlayIcon className="w-4 h-4" />
              <span>Save &amp; Resume</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
