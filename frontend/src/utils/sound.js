class SoundEngine {
  constructor() {
    this.ctx = null;
    this.sfxEnabled = true;
    this.musicEnabled = false;
    this.ambientNodes = null;
  }

  ensureContext() {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setSfxEnabled(enabled) {
    this.sfxEnabled = enabled;
  }

  setMusicEnabled(enabled) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopAmbient();
    } else {
      this.startAmbient();
    }
  }

  startAmbient() {
    if (!this.musicEnabled || this.ambientNodes) return;
    try {
      const ctx = this.ensureContext();
      if (!ctx) return;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 1.4);
      masterGain.connect(ctx.destination);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, ctx.currentTime);
      filter.connect(masterGain);

      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(110, ctx.currentTime);

      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(164.81, ctx.currentTime);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.18, ctx.currentTime);
      lfoGain.gain.setValueAtTime(110, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      osc1.connect(filter);
      osc2.connect(filter);

      osc1.start();
      osc2.start();
      lfo.start();

      this.ambientNodes = { osc1, osc2, lfo, masterGain };
    } catch {
      // Audio playback blocked before interaction
    }
  }

  stopAmbient() {
    if (!this.ambientNodes || !this.ctx) return;
    try {
      const { osc1, osc2, lfo, masterGain } = this.ambientNodes;
      const now = this.ctx.currentTime;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(Math.max(masterGain.gain.value, 0.001), now);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      setTimeout(() => {
        try {
          osc1.stop();
          osc2.stop();
          lfo.stop();
        } catch {
          // Ignore cleanup errors
        }
      }, 380);
    } catch {
      // Ignore cleanup errors
    } finally {
      this.ambientNodes = null;
    }
  }

  playTone({ freq, endFreq, duration = 0.14, type = 'sine', volume = 0.12, delay = 0 }) {
    if (!this.sfxEnabled) return;
    try {
      const ctx = this.ensureContext();
      if (!ctx) return;

      const start = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      if (endFreq) {
        osc.frequency.exponentialRampToValueAtTime(endFreq, start + duration);
      }

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration + 0.02);
    } catch {
      // Ignore audio errors
    }
  }

  playClick() {
    this.playTone({ freq: 520, endFreq: 680, duration: 0.055, type: 'sine', volume: 0.06 });
  }

  playCast() {
    this.playTone({ freq: 440, endFreq: 190, duration: 0.16, type: 'sine', volume: 0.1 });
    this.playTone({ freq: 260, endFreq: 140, duration: 0.12, type: 'triangle', volume: 0.06, delay: 0.05 });
  }

  playCatch(combo = 1, isRare = false) {
    const semitoneBoost = Math.min(combo - 1, 7) * 35;
    const base = 480 + semitoneBoost;
    this.playTone({ freq: base, endFreq: base * 1.35, duration: 0.13, type: 'sine', volume: 0.13 });
    this.playTone({
      freq: base * 1.5,
      endFreq: base * 1.85,
      duration: 0.18,
      type: 'triangle',
      volume: 0.1,
      delay: 0.07,
    });
    if (isRare) {
      this.playTone({
        freq: base * 2,
        endFreq: base * 2.25,
        duration: 0.24,
        type: 'sine',
        volume: 0.11,
        delay: 0.14,
      });
    }
  }

  playMiss() {
    this.playTone({ freq: 175, endFreq: 95, duration: 0.16, type: 'sine', volume: 0.08 });
  }

  playZap() {
    this.playTone({ freq: 210, endFreq: 85, duration: 0.24, type: 'sawtooth', volume: 0.09 });
    this.playTone({ freq: 160, endFreq: 70, duration: 0.22, type: 'square', volume: 0.05, delay: 0.06 });
  }

  playLevelUp() {
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((n, idx) => {
      this.playTone({
        freq: n,
        duration: 0.18,
        type: 'triangle',
        volume: 0.1,
        delay: idx * 0.075,
      });
    });
  }

  playGameOver() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone({
        freq: n,
        duration: 0.24,
        type: 'sine',
        volume: 0.11,
        delay: idx * 0.11,
      });
    });
  }
}

export const soundEngine = new SoundEngine();
