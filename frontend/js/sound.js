/**
 * Web Audio Synthesizer Sound Engine
 * File: frontend/js/sound.js
 * 
 * Demonstrates:
 * - Pure Vanilla JavaScript Web Audio API (Zero external mp3/wav files).
 * - Procedural Arcade Synthesizer: Energetic 126 BPM arcade background music.
 * - Procedural sound effects for hook casts, fish catches, electric zaps, and level completions.
 * - Theme A (Low Coupling): Reusable audio engine decoupled from visual presentation.
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.sfxEnabled = true;
        this.musicEnabled = true; // Default ON so players enjoy the energy right away
        this.bgmPlaying = false;
        this.bgmTimer = null;
        this.bgmStep = 0;
        this.bgmGain = null;
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
        this.sfxEnabled = Boolean(enabled);
    }

    setMusicEnabled(enabled) {
        this.musicEnabled = Boolean(enabled);
        if (!this.musicEnabled) {
            this.stopBGM();
        } else {
            this.startBGM();
        }
    }

    // ========================================================
    // ENERGETIC ARCADE BACKGROUND MUSIC SYNTHESIZER (126 BPM)
    // ========================================================
    startBGM() {
        if (!this.musicEnabled || this.bgmPlaying) return;
        const ctx = this.ensureContext();
        if (!ctx) return;

        this.bgmPlaying = true;
        this.bgmStep = 0;

        // Master BGM gain control (balanced nicely under sound effects)
        if (!this.bgmGain) {
            this.bgmGain = ctx.createGain();
            this.bgmGain.connect(ctx.destination);
        }
        this.bgmGain.gain.setValueAtTime(0.001, ctx.currentTime);
        this.bgmGain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.4);

        // Musical Pitch Definitions (Key: D Minor / Arcade Scale)
        const NOTE = {
            D2: 73.42,  F2: 87.31,  G2: 98.00,  A2: 110.00,
            D3: 146.83, F3: 174.61, G3: 196.00, A3: 220.00,
            D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00,
            A4: 440.00, Bb4: 466.16, C5: 523.25, D5: 587.33,
            E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00
        };

        // 16-Step Arcade Bassline Pattern (Driving 8th notes)
        const bassSequence = [
            NOTE.D2, NOTE.D3, NOTE.D2, NOTE.D3, // Bar 1: Dm
            NOTE.F2, NOTE.F3, NOTE.F2, NOTE.F3, // Bar 2: F
            NOTE.G2, NOTE.G3, NOTE.G2, NOTE.G3, // Bar 3: G
            NOTE.A2, NOTE.A3, NOTE.G2, NOTE.A2  // Bar 4: A
        ];

        // 32-Step Energetic Chiptune Lead Arpeggio
        const leadSequence = [
            // Bar 1 (Dm)
            NOTE.D4, NOTE.A4, NOTE.F4, NOTE.D5, NOTE.A4, NOTE.F4, NOTE.D5, NOTE.A4,
            // Bar 2 (F)
            NOTE.F4, NOTE.C5, NOTE.A4, NOTE.F5, NOTE.C5, NOTE.A4, NOTE.F5, NOTE.C5,
            // Bar 3 (G)
            NOTE.G4, NOTE.D5, NOTE.Bb4, NOTE.G5, NOTE.D5, NOTE.Bb4, NOTE.G5, NOTE.D5,
            // Bar 4 (A turnaround)
            NOTE.A4, NOTE.E5, NOTE.C5, NOTE.A5, NOTE.G5, NOTE.E5, NOTE.F5, NOTE.E5
        ];

        const stepDuration = 60 / 126 / 4; // 16th note timing at 126 BPM (~119ms)

        const scheduleBeat = () => {
            if (!this.bgmPlaying || !this.musicEnabled) return;
            const now = ctx.currentTime;

            // 1. Synthesize Bass Pulse (on every 16th step pair)
            if (this.bgmStep % 2 === 0) {
                const bassIndex = (this.bgmStep / 2) % bassSequence.length;
                const bassFreq = bassSequence[bassIndex];

                const bassOsc = ctx.createOscillator();
                const bassGain = ctx.createGain();
                const bassFilter = ctx.createBiquadFilter();

                bassOsc.type = 'sawtooth';
                bassOsc.frequency.setValueAtTime(bassFreq, now);

                bassFilter.type = 'lowpass';
                bassFilter.frequency.setValueAtTime(380, now);
                bassFilter.frequency.exponentialRampToValueAtTime(140, now + 0.16);

                bassGain.gain.setValueAtTime(0.001, now);
                bassGain.gain.exponentialRampToValueAtTime(0.12, now + 0.015);
                bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

                bassOsc.connect(bassFilter);
                bassFilter.connect(bassGain);
                bassGain.connect(this.bgmGain);

                bassOsc.start(now);
                bassOsc.stop(now + 0.20);
            }

            // 2. Synthesize High-Energy Melodic Arpeggio
            const leadFreq = leadSequence[this.bgmStep % leadSequence.length];
            if (leadFreq) {
                const leadOsc = ctx.createOscillator();
                const leadGain = ctx.createGain();

                leadOsc.type = (this.bgmStep % 4 === 0) ? 'triangle' : 'sine';
                leadOsc.frequency.setValueAtTime(leadFreq, now);

                leadGain.gain.setValueAtTime(0.001, now);
                leadGain.gain.exponentialRampToValueAtTime(0.07, now + 0.012);
                leadGain.gain.exponentialRampToValueAtTime(0.0001, now + stepDuration * 0.85);

                leadOsc.connect(leadGain);
                leadGain.connect(this.bgmGain);

                leadOsc.start(now);
                leadOsc.stop(now + stepDuration);
            }

            // 3. Synthesize Subtle Off-Beat Percussive Hi-Hat Ticks
            if (this.bgmStep % 4 === 2) {
                const tickOsc = ctx.createOscillator();
                const tickGain = ctx.createGain();
                const tickFilter = ctx.createBiquadFilter();

                tickOsc.type = 'square';
                tickOsc.frequency.setValueAtTime(1800, now);

                tickFilter.type = 'highpass';
                tickFilter.frequency.setValueAtTime(2400, now);

                tickGain.gain.setValueAtTime(0.001, now);
                tickGain.gain.exponentialRampToValueAtTime(0.02, now + 0.005);
                tickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

                tickOsc.connect(tickFilter);
                tickFilter.connect(tickGain);
                tickGain.connect(this.bgmGain);

                tickOsc.start(now);
                tickOsc.stop(now + 0.05);
            }

            this.bgmStep = (this.bgmStep + 1) % leadSequence.length;
        };

        // Run the step clock
        this.bgmTimer = setInterval(scheduleBeat, stepDuration * 1000);
    }

    stopBGM() {
        this.bgmPlaying = false;
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
        if (this.bgmGain && this.ctx) {
            try {
                const now = this.ctx.currentTime;
                this.bgmGain.gain.cancelScheduledValues(now);
                this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, now);
                this.bgmGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
            } catch (e) {}
        }
    }

    // ========================================================
    // PROCEDURAL ARCADE SOUND EFFECTS
    // ========================================================
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
        } catch (e) {}
    }

    playClick() {
        this.playTone({ freq: 520, endFreq: 680, duration: 0.055, type: 'sine', volume: 0.06 });
    }

    playCast() {
        this.playTone({ freq: 440, endFreq: 190, duration: 0.16, type: 'sine', volume: 0.1 });
        this.playTone({ freq: 260, endFreq: 140, duration: 0.12, type: 'triangle', volume: 0.06, delay: 0.05 });
    }

    playCatch(isRare = false) {
        const base = 520;
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

    playMissionFailed() {
        const notes = [392, 349.23, 293.66, 220];
        notes.forEach((n, idx) => {
            this.playTone({
                freq: n,
                duration: 0.22,
                type: 'sine',
                volume: 0.1,
                delay: idx * 0.12,
            });
        });
    }
}

// Global singleton instance
window.soundEngine = window.soundEngine || new SoundEngine();
