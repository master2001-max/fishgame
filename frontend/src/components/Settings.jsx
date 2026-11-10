import { ArrowLeftIcon, SlidersIcon, VolumeOffIcon, VolumeOnIcon } from './Icons';
import { DIFFICULTY_CONFIG, LURE_STYLES } from '../utils/gameConfig';
import { soundEngine } from '../utils/sound';

function ToggleSwitch({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="text-xs text-slate-400">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => {
          soundEngine.playClick();
          onChange(!checked);
        }}
        className={`relative w-12 h-7 rounded-full transition-colors duration-200 cursor-pointer shrink-0 border ${
          checked
            ? 'bg-cyan-400 border-cyan-300/60 shadow-[0_0_12px_rgba(34,211,238,0.4)]'
            : 'bg-slate-800 border-white/15'
        }`}
      >
        <span
          className={`block w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export default function Settings({ settings, onUpdateSettings, onReturnHome, returnLabel = "Hunter's Hub" }) {
  const updateField = (key, value) => {
    onUpdateSettings({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="w-full max-w-[760px] mx-auto px-4 py-6 animate-modal-enter">
      <div className="glass-panel rounded-[30px] p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 inset-x-16 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />

        {/* Header */}
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
            <span>{returnLabel}</span>
          </button>

          <div className="flex items-center gap-2.5">
            <SlidersIcon className="w-5 h-5 text-cyan-300" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Hunter&apos;s Gear
            </h2>
          </div>

          <div className="w-[110px] hidden sm:block" />
        </div>

        <div className="flex flex-col gap-5">
          {/* Audio Section */}
          <div className="glass-subcard rounded-2xl p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-300 mb-3">
              {settings.sfx || settings.music ? (
                <VolumeOnIcon className="w-4 h-4" />
              ) : (
                <VolumeOffIcon className="w-4 h-4" />
              )}
              <span>Audio &amp; Acoustics</span>
            </div>

            <div className="divide-y divide-white/8">
              <ToggleSwitch
                checked={settings.music}
                onChange={(val) => updateField('music', val)}
                label="Ambient Ocean Soundscape"
                description="Gentle underwater resonance while navigating and hunting"
              />
              <ToggleSwitch
                checked={settings.sfx}
                onChange={(val) => updateField('sfx', val)}
                label="Arcade Sound Effects"
                description="Line cast splashes, combo chimes, level ups, and alerts"
              />
            </div>
          </div>

          {/* Difficulty Selector */}
          <div className="glass-subcard rounded-2xl p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-300 mb-3">
              Ocean Difficulty
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(DIFFICULTY_CONFIG).map(([key, meta]) => {
                const active = settings.difficulty === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      updateField('difficulty', key);
                    }}
                    className={`rounded-2xl p-4 text-left border transition-all cursor-pointer ${
                      active
                        ? 'bg-cyan-400/18 border-cyan-300/70 shadow-[0_0_20px_rgba(34,211,238,0.18)]'
                        : 'bg-slate-950/40 border-white/10 hover:border-cyan-300/35'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-bold text-white text-sm">{key}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          active
                            ? 'bg-cyan-300 text-slate-950'
                            : 'bg-white/10 text-cyan-200'
                        }`}
                      >
                        {meta.badge}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-cyan-200/90 mb-1">
                      {meta.label}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {meta.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hook Lure Style */}
          <div className="glass-subcard rounded-2xl p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-300 mb-3">
              Hook &amp; Lure Rig
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.values(LURE_STYLES).map((lure) => {
                const active = settings.lureStyle === lure.id;
                return (
                  <button
                    key={lure.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      updateField('lureStyle', lure.id);
                    }}
                    className={`rounded-2xl p-3.5 flex items-center gap-3 border transition-all cursor-pointer ${
                      active
                        ? 'bg-cyan-400/18 border-cyan-300/70'
                        : 'bg-slate-950/40 border-white/10 hover:border-cyan-300/35'
                    }`}
                  >
                    <span
                      className="w-8 h-8 rounded-xl border border-white/20 flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: 'rgba(2, 11, 24, 0.8)',
                        boxShadow: `0 0 14px ${lure.glowColor}`,
                      }}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: lure.previewHex }}
                      />
                    </span>
                    <div className="text-left">
                      <div className="text-sm font-bold text-white">{lure.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {active ? 'Equipped' : 'Select rig'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
