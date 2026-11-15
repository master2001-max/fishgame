/**
 * Fish Catcher - Core Game Engine (Vanilla JavaScript & HTML5 Canvas)
 * File: js/game.js
 * 
 * Demonstrates:
 * - Low Coupling: Reads configuration from window.GAME_BOOTSTRAP and communicates via standard fetch() APIs.
 * - Event-Driven Programming: DOM event listeners for keyboard, mouse, touch, and UI modals.
 * - Interoperability: Integrates Dr. Marc Conrad's Fish Game API procedural riddle challenge.
 * - Virtual Identity: Sends authenticated scores and saves session snapshots to the PHP/MySQL backend.
 */

// ========================================================
// 1. GAME CONSTANTS & SPECIES CONFIGURATION
// ========================================================
const LOGICAL_W = 880;
const LOGICAL_H = 460;
const WATER_SURFACE_Y = 78;

// ========================================================
// 2. DEVELOPER-FRIENDLY SPECIES & DIFFICULTY CONFIGURATION
// ========================================================
// Fish species, point values, swimming speeds, and difficulty parameters
// are centrally managed in frontend/js/fish_config.js for developer simplicity.
// To add new fish, change marks, or tune speeds: edit frontend/js/fish_config.js!
const getFishSpecies = () => {
    if (typeof window !== 'undefined' && window.FISH_SPECIES && window.FISH_SPECIES.length > 0) {
        return window.FISH_SPECIES;
    }
    // Safe fallback if fish_config.js is not loaded
    return [
        { id: 'clownfish', name: 'Striped Clownfish', points: 40, rarity: 'Common', isSpecial: false, speedBase: 1.2, sizeX: 13, sizeY: 6.5, color: '#fb923c', accentColor: '#fdba74', bellyColor: '#ffffff', glow: null, minDepth: 75, maxDepth: 190 },
        { id: 'tang', name: 'Azure Tang', points: 75, rarity: 'Common', isSpecial: false, speedBase: 1.45, sizeX: 15, sizeY: 8, color: '#38bdf8', accentColor: '#0284c7', bellyColor: '#bae6fd', glow: null, minDepth: 100, maxDepth: 250 },
        { id: 'barb', name: 'Gilded Barb', points: 110, rarity: 'Uncommon', isSpecial: false, speedBase: 1.85, sizeX: 17, sizeY: 8.5, color: '#fbbf24', accentColor: '#d97706', bellyColor: '#fef3c7', glow: 'rgba(251, 191, 36, 0.45)', minDepth: 130, maxDepth: 310 },
        { id: 'redfin', name: 'Crimson Redfin', points: 160, rarity: 'Uncommon', isSpecial: false, speedBase: 2.15, sizeX: 19, sizeY: 9.5, color: '#f43f5e', accentColor: '#be123c', bellyColor: '#ffe4e6', glow: 'rgba(244, 63, 94, 0.45)', minDepth: 170, maxDepth: 350 },
        { id: 'angelfish', name: 'Phantom Angelfish', points: 220, rarity: 'Rare', isSpecial: false, speedBase: 2.55, sizeX: 21, sizeY: 13, color: '#c084fc', accentColor: '#7e22ce', bellyColor: '#f3e8ff', glow: 'rgba(192, 132, 252, 0.6)', minDepth: 210, maxDepth: 390 },
        { id: 'biolume', name: 'Abyssal Biolume', points: 300, rarity: 'Mythic', isSpecial: false, speedBase: 2.85, sizeX: 24, sizeY: 11, color: '#2dd4bf', accentColor: '#0f766e', bellyColor: '#ccfbf1', glow: 'rgba(45, 212, 191, 0.85)', minDepth: 260, maxDepth: 420 },
        { id: 'oracle', name: 'Golden Oracle of Conrad', points: 150, rarity: 'Legendary', isSpecial: true, speedBase: 2.2, sizeX: 18, sizeY: 9, color: '#fbbf24', accentColor: '#f59e0b', bellyColor: '#fffbeb', glow: 'rgba(251, 191, 36, 0.95)', minDepth: 160, maxDepth: 390 }
    ];
};

const getDifficultyConfig = () => {
    if (typeof window !== 'undefined' && window.DIFFICULTY_CONFIG) {
        return window.DIFFICULTY_CONFIG;
    }
    return {
        Easy:   { duration: 90, speedMultiplier: 0.65, scoreMultiplier: 0.5, jellyfishCount: 0, zapPenalty: 0, dropSpeed: 7.4, retractSpeed: 9.2, fishCount: 9 },
        Normal: { duration: 60, speedMultiplier: 1.0, scoreMultiplier: 1.0, jellyfishCount: 1, zapPenalty: 120, dropSpeed: 8.6, retractSpeed: 10.4, fishCount: 11 },
        Hard:   { duration: 30, speedMultiplier: 1.45, scoreMultiplier: 2.0, jellyfishCount: 2, zapPenalty: 280, dropSpeed: 9.8, retractSpeed: 11.6, fishCount: 13 }
    };
};

const LURE_STYLES = {
    steel: {
        name: 'Classic Steel',
        lineColor: 'rgba(226, 232, 240, 0.85)',
        hookColor: '#cbd5e1',
        glowColor: 'rgba(148, 163, 184, 0.45)',
    },
    biolum: {
        name: 'Biolume Cyan',
        lineColor: 'rgba(103, 232, 249, 0.9)',
        hookColor: '#22d3ee',
        glowColor: 'rgba(34, 211, 238, 0.85)',
    },
    solar: {
        name: 'Solar Gold',
        lineColor: 'rgba(253, 224, 71, 0.9)',
        hookColor: '#fbbf24',
        glowColor: 'rgba(251, 191, 36, 0.85)',
    },
};

// ========================================================
// 2. HELPER ENTITY CONSTRUCTORS
// ========================================================
function createFishEntity(species, startOffscreen = false) {
    const dir = Math.random() > 0.5 ? 1 : -1;
    const x = startOffscreen
        ? (dir > 0 ? -70 - Math.random() * 60 : LOGICAL_W + 70 + Math.random() * 60)
        : 70 + Math.random() * (LOGICAL_W - 140);
    const y = species.minDepth + Math.random() * (species.maxDepth - species.minDepth);

    return {
        kind: 'fish',
        species,
        x,
        y,
        baseY: y,
        dir,
        speed: species.speedBase * (0.9 + Math.random() * 0.22),
        phase: Math.random() * Math.PI * 2,
        bobAmp: 3 + Math.random() * 5,
    };
}

function createJellyfishEntity(index) {
    const dir = index % 2 === 0 ? 1 : -1;
    return {
        kind: 'jellyfish',
        x: dir > 0 ? 120 + index * 240 : LOGICAL_W - 140 - index * 200,
        y: 195 + index * 95,
        baseY: 195 + index * 95,
        dir,
        speed: 0.85 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2,
    };
}

function createPearlEntity() {
    return {
        kind: 'pearl',
        x: 110 + Math.random() * (LOGICAL_W - 220),
        y: 355 + Math.random() * 45,
        phase: Math.random() * Math.PI * 2,
        life: 14,
    };
}

function pickNextSpecies(level) {
    const species = getFishSpecies();
    if (!species || species.length === 0) return null;

    // 25% chance to spawn the special Dr. Marc Conrad API puzzle fish
    const oracleFish = species.find((f) => f.isSpecial || f.id === 'oracle');
    if (oracleFish && Math.random() < 0.25) {
        return oracleFish;
    }

    const normal = species.filter((f) => !f.isSpecial && f.id !== 'oracle');
    if (normal.length === 0) return species[0];

    // Progression curve: deeper/rarer fish appear more frequently in higher levels
    const levelBias = Math.min(1.0, (level - 1) / 5);
    const roll = Math.random();
    const index = Math.min(normal.length - 1, Math.floor(Math.pow(roll, 1 - levelBias * 0.45) * normal.length));
    return normal[index];
}

// ========================================================
// 3. MAIN GAME CONTROLLER CLASS
// ========================================================
class FishCatcherGame {
    constructor() {
        const boot = window.GAME_BOOTSTRAP || {};
        this.difficulty = boot.difficulty || 'Easy';
        this.level = boot.level || 1;
        this.targetMarks = boot.targetMarks || 500;
        this.bestScore = boot.bestScore || 0;
        this.resumeSession = boot.resumeSession || null;
        this.settings = boot.settings || { music: true, sfx: true, difficulty: 'Easy', lureStyle: 'biolum' };

        const diffTable = getDifficultyConfig();
        this.diffConf = diffTable[this.difficulty] || diffTable.Easy;

        // Game State variables
        this.score = this.resumeSession ? this.resumeSession.score : 0;
        this.catches = this.resumeSession ? this.resumeSession.catches : 0;
        this.timeLeft = this.resumeSession ? this.resumeSession.timeLeft : this.diffConf.duration;
        this.isPaused = false;
        this.isOracleOpen = false;
        this.missionStatus = 'playing'; // 'playing' | 'won' | 'lost'

        // Canvas & Context
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = LOGICAL_W * this.dpr;
        this.canvas.height = LOGICAL_H * this.dpr;

        // UI Element References
        this.hudScore = document.getElementById('hudScore');
        this.hudProgressBar = document.getElementById('hudProgressBar');
        this.hudTimer = document.getElementById('hudTimer');
        this.catchBanner = document.getElementById('catchBanner');
        this.pauseModal = document.getElementById('pauseModal');
        this.oracleModal = document.getElementById('oracleModal');
        this.outcomeModal = document.getElementById('outcomeModal');

        // Simulation State
        this.sim = {
            time: 0,
            boatX: LOGICAL_W / 2,
            targetBoatX: LOGICAL_W / 2,
            hookY: WATER_SURFACE_Y + 14,
            hookState: 'idle', // 'idle' | 'dropping' | 'retracting'
            caughtEntity: null,
            fishes: [],
            jellyfishes: [],
            pearl: Math.random() < 0.65 ? createPearlEntity() : null,
            pearlCooldown: 6,
            bubbles: Array.from({ length: 24 }, () => ({
                x: Math.random() * LOGICAL_W,
                y: WATER_SURFACE_Y + Math.random() * (LOGICAL_H - WATER_SURFACE_Y),
                r: 1.2 + Math.random() * 3.2,
                speed: 0.35 + Math.random() * 0.9,
                wobble: Math.random() * Math.PI * 2,
            })),
            kelp: Array.from({ length: 16 }, (_, i) => ({
                x: 35 + i * 56 + (Math.random() * 20 - 10),
                height: 40 + Math.random() * 55,
                phase: Math.random() * Math.PI * 2,
                hue: i % 3 === 0 ? '#0f766e' : '#065f46',
            })),
            particles: [],
            popups: [],
            keys: { left: false, right: false },
            shakeTime: 0,
            wasSubmerged: false,
            lastTime: performance.now(),
        };

        this.initFishes();
        this.initEventListeners();
        this.initAudio();
        this.startCountdown();
        this.startAutoSave();
        this.updateHUD();

        this.animationId = requestAnimationFrame((now) => this.render(now));
    }

    initFishes() {
        const species = getFishSpecies();
        const count = this.diffConf.fishCount || 10;
        const initial = [];
        const oracle = species.find((f) => f.isSpecial || f.id === 'oracle');

        // Chance to spawn special Marc Conrad API puzzle fish at round start
        if (oracle && Math.random() < 0.40) {
            initial.push(oracle);
        }
        while (initial.length < count) {
            initial.push(pickNextSpecies(this.level));
        }
        this.sim.fishes = initial.map((sp) => createFishEntity(sp, false));
        this.sim.jellyfishes = Array.from({ length: this.diffConf.jellyfishCount }, (_, i) =>
            createJellyfishEntity(i)
        );
    }

    initAudio() {
        if (window.soundEngine) {
            window.soundEngine.setSfxEnabled(this.settings.sfx);
            window.soundEngine.setMusicEnabled(this.settings.music);
            if (this.settings.music && !this.isPaused && this.missionStatus === 'playing') {
                window.soundEngine.startBGM();
            } else {
                window.soundEngine.stopBGM();
            }
        }
        this.updateSoundUI();
    }

    updateSoundUI() {
        const btn = document.getElementById('muteBtn');
        const iconWrap = document.getElementById('muteIconWrap');
        const label = document.getElementById('muteLabel');
        if (!btn) return;

        const isAudioActive = Boolean(this.settings.sfx || this.settings.music);

        if (isAudioActive) {
            btn.classList.remove('sound-muted');
            btn.classList.add('sound-active');
            btn.title = 'Audio is ON (Click to Mute SFX & Energetic BGM)';
            if (label) label.textContent = 'Audio: ON';
            if (iconWrap) {
                iconWrap.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    </svg>
                `;
            }
        } else {
            btn.classList.remove('sound-active');
            btn.classList.add('sound-muted');
            btn.title = 'Audio is MUTED (Click to Turn Sound & Music ON)';
            if (label) label.textContent = 'Audio: MUTED';
            if (iconWrap) {
                iconWrap.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <line x1="23" y1="9" x2="17" y2="15"></line>
                        <line x1="17" y1="9" x2="23" y2="15"></line>
                    </svg>
                `;
            }
        }
    }

    // ========================================================
    // 4. EVENT LISTENERS (THEME: EVENT-DRIVEN PROGRAMMING)
    // ========================================================
    initEventListeners() {
        // Pointer / Mouse steering
        const getCanvasX = (clientX) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = LOGICAL_W / rect.width;
            return Math.max(85, Math.min(LOGICAL_W - 85, (clientX - rect.left) * scaleX));
        };

        this.canvas.addEventListener('pointermove', (e) => {
            if (this.isPaused || this.missionStatus !== 'playing') return;
            this.sim.targetBoatX = getCanvasX(e.clientX);
        });

        this.canvas.addEventListener('pointerdown', (e) => {
            if (this.isPaused || this.missionStatus !== 'playing') return;
            const x = getCanvasX(e.clientX);
            this.sim.targetBoatX = x;
            if (e.pointerType === 'touch' && this.sim.hookState === 'idle') {
                this.sim.boatX = x;
            }
            this.triggerDrop();
        });

        // Keyboard Controls: A/D or Left/Right arrows steer boat; Space or Down drops hook
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
                e.preventDefault();
                this.togglePause();
                return;
            }

            if (this.isPaused || this.missionStatus !== 'playing') return;

            if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
                this.sim.keys.left = true;
            } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
                this.sim.keys.right = true;
            } else if (e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                this.triggerDrop();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
                this.sim.keys.left = false;
            } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
                this.sim.keys.right = false;
            }
        });

        // Unlock Web Audio context & start energetic arcade BGM on first user gesture
        const unlockAudioOnGesture = () => {
            if (window.soundEngine) {
                window.soundEngine.ensureContext();
                if (this.settings.music && !this.isPaused && this.missionStatus === 'playing') {
                    window.soundEngine.startBGM();
                }
            }
        };
        this.canvas.addEventListener('pointerdown', unlockAudioOnGesture, { once: true });
        window.addEventListener('keydown', unlockAudioOnGesture, { once: true });

        // Pause button
        document.getElementById('pauseBtn')?.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.playClick();
            this.togglePause();
        });

        // Quick mute toggle button with clear visual preview & BGM control
        document.getElementById('muteBtn')?.addEventListener('click', () => {
            if (window.soundEngine) {
                window.soundEngine.ensureContext();
            }
            const isCurrentlyMuted = !this.settings.sfx && !this.settings.music;
            const newActiveState = isCurrentlyMuted; // Toggle: If muted, enable sound; if active, mute
            this.settings.sfx = newActiveState;
            this.settings.music = newActiveState;

            if (window.soundEngine && newActiveState) {
                window.soundEngine.playClick();
            }
            this.initAudio();

            if (this.catchBanner) {
                this.catchBanner.textContent = newActiveState 
                    ? '🔊 Sound & Energetic Arcade BGM Enabled!' 
                    : '🔇 Audio Muted (Silent Mode)';
            }

            fetch('../backend/actions/update_settings.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.settings)
            }).catch(() => {});
        });

        // Pause modal buttons
        document.getElementById('resumeMissionBtn')?.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.playClick();
            this.togglePause();
        });

        document.getElementById('restartMissionBtn')?.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.playClick();
            this.restartMission();
        });

        document.getElementById('saveAndExitBtn')?.addEventListener('click', async () => {
            if (window.soundEngine) window.soundEngine.playClick();
            await this.saveSessionSnapshot();
            window.location.href = 'dashboard.php';
        });

        // Oracle Riddle submission form
        const oracleForm = document.getElementById('oracleForm');
        oracleForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleOracleSubmit();
        });

        document.getElementById('closeOracleBtn')?.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.playClick();
            this.closeOracleModal();
        });

        // Outcome modal buttons
        document.getElementById('replayLevelBtn')?.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.playClick();
            this.restartMission();
        });

        document.getElementById('primaryOutcomeBtn')?.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.playClick();
            if (this.missionStatus === 'won') {
                this.advanceToNextStage();
            } else {
                this.restartMission();
            }
        });
    }

    triggerDrop() {
        if (this.sim.hookState === 'idle') {
            this.sim.hookState = 'dropping';
            if (window.soundEngine) window.soundEngine.playCast();
        }
    }

    togglePause() {
        if (this.missionStatus !== 'playing') return;
        this.isPaused = !this.isPaused;
        this.pauseModal.style.display = this.isPaused ? 'flex' : 'none';
        if (window.soundEngine) {
            if (this.isPaused) {
                window.soundEngine.stopBGM();
            } else if (this.settings.music) {
                window.soundEngine.startBGM();
            }
        }
    }

    startCountdown() {
        this.timerInterval = setInterval(() => {
            if (this.missionStatus === 'playing' && !this.isPaused && !this.isOracleOpen) {
                if (this.timeLeft > 0) {
                    this.timeLeft -= 1;
                    this.updateHUD();
                }
                if (this.timeLeft <= 0) {
                    this.handleMissionOutcome();
                }
            }
        }, 1000);
    }

    startAutoSave() {
        // Automatically save game snapshot every 4 seconds
        this.autoSaveInterval = setInterval(() => {
            if (this.missionStatus === 'playing' && this.timeLeft > 0 && !this.isPaused) {
                this.saveSessionSnapshot();
            }
        }, 4000);

        window.addEventListener('beforeunload', () => {
            if (this.missionStatus === 'playing' && this.timeLeft > 0) {
                navigator.sendBeacon(
                    '../backend/actions/save_session.php',
                    JSON.stringify({
                        difficulty: this.difficulty,
                        level: this.level,
                        score: this.score,
                        catches: this.catches,
                        timeLeft: this.timeLeft
                    })
                );
            }
        });
    }

    async saveSessionSnapshot() {
        try {
            await fetch('../backend/actions/save_session.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    difficulty: this.difficulty,
                    level: this.level,
                    score: this.score,
                    catches: this.catches,
                    timeLeft: this.timeLeft
                })
            });
        } catch (e) {}
    }

    updateHUD() {
        if (this.hudScore) this.hudScore.textContent = this.score.toLocaleString();
        
        const pct = Math.min(100, Math.round((this.score / this.targetMarks) * 100));
        if (this.hudProgressBar) this.hudProgressBar.style.width = `${pct}%`;

        if (this.hudTimer) {
            const mins = Math.floor(this.timeLeft / 60);
            const secs = this.timeLeft % 60;
            this.hudTimer.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

            this.hudTimer.classList.remove('timer-warning', 'timer-danger');
            if (this.timeLeft <= 8) {
                this.hudTimer.classList.add('timer-danger');
            } else if (this.timeLeft <= 15) {
                this.hudTimer.classList.add('timer-warning');
            }
        }
    }

    // ========================================================
    // 5. THIRD-PARTY API INTEROPERABILITY (MARC CONRAD FISH API)
    // ========================================================
    async openOracleChallenge() {
        this.isPaused = true;
        this.isOracleOpen = true;
        this.oracleModal.style.display = 'flex';
        if (window.soundEngine) {
            window.soundEngine.stopBGM();
        }

        const loading = document.getElementById('oracleLoading');
        const content = document.getElementById('oracleContent');
        const banner = document.getElementById('oracleResultBanner');
        const img = document.getElementById('oracleImage');
        const input = document.getElementById('oracleAnswerInput');
        const submitBtn = document.getElementById('oracleSubmitBtn');

        loading.style.display = 'flex';
        content.style.display = 'none';
        banner.style.display = 'none';
        input.value = '';
        input.disabled = false;
        submitBtn.disabled = false;

        try {
            // Interoperability HTTP GET request to our PHP backend proxy
            const res = await fetch('../backend/api/fish.php?action=challenge');
            const data = await res.json();

            if (data.success) {
                this.currentPuzzleId = data.puzzleId;
                const reveal = () => {
                    loading.style.display = 'none';
                    content.style.display = 'flex';
                    input.focus();
                };
                img.onload = reveal;
                img.src = data.imageUrl;
                if (img.complete) {
                    reveal();
                }
            } else {
                throw new Error(data.error || 'Failed to summon riddle.');
            }
        } catch (err) {
            loading.style.display = 'none';
            content.style.display = 'flex';
            banner.style.display = 'block';
            banner.style.background = 'rgba(244, 63, 94, 0.2)';
            banner.style.color = '#fecdd3';
            banner.textContent = 'Oracle connection timeout. Please continue fishing.';
        }
    }

    async handleOracleSubmit() {
        const input = document.getElementById('oracleAnswerInput');
        const submitBtn = document.getElementById('oracleSubmitBtn');
        const banner = document.getElementById('oracleResultBanner');
        const title = document.getElementById('oracleResultTitle');
        const msg = document.getElementById('oracleResultMessage');

        const answer = parseInt(input.value, 10);
        if (isNaN(answer) || !this.currentPuzzleId) return;

        submitBtn.disabled = true;
        input.disabled = true;

        try {
            if (window.soundEngine) window.soundEngine.playClick();

            // Submit guess via HTTP POST to PHP proxy
            const res = await fetch('../backend/api/fish.php?action=verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    puzzleId: this.currentPuzzleId,
                    answer: answer
                })
            });

            const result = await res.json();
            banner.style.display = 'block';

            if (result.correct) {
                banner.style.background = 'rgba(52, 211, 153, 0.2)';
                banner.style.border = '1px solid rgba(52, 211, 153, 0.4)';
                banner.style.color = '#a7f3d0';
                title.textContent = '🎉 Riddle Solved!';
                msg.textContent = `${result.message} (+${result.bonusMarks} Marks)`;

                this.score += result.bonusMarks;
                this.updateHUD();

                if (window.soundEngine) window.soundEngine.playLevelUp();
                this.catchBanner.textContent = `✨ Oracle Solved! +${result.bonusMarks} Bonus Marks!`;
            } else {
                banner.style.background = 'rgba(244, 63, 94, 0.2)';
                banner.style.border = '1px solid rgba(244, 63, 94, 0.4)';
                banner.style.color = '#fecdd3';
                title.textContent = '❌ Incorrect Riddle Guess!';
                msg.textContent = `${result.message} (-${result.penaltyMarks || 50} Marks)`;

                this.score = Math.max(0, this.score - (result.penaltyMarks || 50));
                this.updateHUD();

                if (window.soundEngine) window.soundEngine.playZap();
                this.catchBanner.textContent = `⚠️ Wrong Oracle Guess! -${result.penaltyMarks || 50} Penalty Deducted!`;
            }
        } catch (err) {
            console.error('Verification error:', err);
        }
    }

    closeOracleModal() {
        this.oracleModal.style.display = 'none';
        this.isOracleOpen = false;
        this.isPaused = false;
        if (window.soundEngine && this.settings.music && this.missionStatus === 'playing') {
            window.soundEngine.startBGM();
        }
        this.updateHUD();

        // Check if level was cleared after receiving oracle marks
        if (this.score >= this.targetMarks && this.missionStatus === 'playing') {
            this.handleMissionOutcome();
        }
    }

    // ========================================================
    // 6. MISSION OUTCOME & ANTI-CHEAT SUBMISSION
    // ========================================================
    async handleMissionOutcome() {
        if (this.missionStatus !== 'playing') return;
        if (window.soundEngine) {
            window.soundEngine.stopBGM();
        }

        const won = (this.score >= this.targetMarks);
        this.missionStatus = won ? 'won' : 'lost';

        // Play appropriate sound effect
        if (won) {
            if (window.soundEngine) window.soundEngine.playLevelUp();
        } else {
            if (window.soundEngine) window.soundEngine.playMissionFailed();
        }

        // Anti-cheat verification and database persistence on backend
        try {
            const res = await fetch('../backend/actions/save_score.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    difficulty: this.difficulty,
                    level: this.level,
                    score: this.score,
                    catches: this.catches,
                    won: won
                })
            });
            const data = await res.json();
            this.showOutcomeModal(won, data.isNewHighScore);
        } catch (e) {
            this.showOutcomeModal(won, false);
        }
    }

    showOutcomeModal(won, isNewHighScore) {
        this.outcomeModal.style.display = 'flex';

        const title = document.getElementById('outcomeTitle');
        const subtitle = document.getElementById('outcomeSubtitle');
        const iconCircle = document.getElementById('outcomeIconCircle');
        const scoreVal = document.getElementById('outcomeScoreVal');
        const timeLeftVal = document.getElementById('outcomeTimeLeftVal');
        const catchesVal = document.getElementById('outcomeCatchesVal');
        const shortfallMsg = document.getElementById('outcomeShortfallMsg');
        const highScorePill = document.getElementById('highScorePill');
        const primaryBtnText = document.getElementById('primaryOutcomeBtnText');

        scoreVal.textContent = this.score.toLocaleString();
        catchesVal.textContent = this.catches;
        
        const mins = Math.floor(this.timeLeft / 60);
        const secs = this.timeLeft % 60;
        timeLeftVal.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        if (isNewHighScore) {
            highScorePill.style.display = 'inline-flex';
        } else {
            highScorePill.style.display = 'none';
        }

        if (won) {
            iconCircle.style.background = 'rgba(52, 211, 153, 0.2)';
            iconCircle.style.border = '1px solid rgba(52, 211, 153, 0.4)';
            iconCircle.style.color = '#34d399';
            iconCircle.innerHTML = '✨';

            title.textContent = (this.level === 6) ? `${this.difficulty} Mode Cleared!` : `Level ${this.level} Complete!`;
            subtitle.textContent = `Target reached on ${this.difficulty} currents. High hunter mastery!`;
            shortfallMsg.style.display = 'none';

            primaryBtnText.textContent = (this.level === 6) ? 'Conquer Next Difficulty' : `Next Level (Lv. ${this.level + 1})`;
        } else {
            iconCircle.style.background = 'rgba(244, 63, 94, 0.2)';
            iconCircle.style.border = '1px solid rgba(251, 113, 133, 0.4)';
            iconCircle.style.color = '#fb7185';
            iconCircle.innerHTML = '⚓';

            title.textContent = "Time's Up!";
            subtitle.textContent = `Collect ${this.targetMarks.toLocaleString()} marks before time runs out.`;
            shortfallMsg.style.display = 'block';
            shortfallMsg.textContent = `Short by ${(this.targetMarks - this.score).toLocaleString()} marks`;

            primaryBtnText.textContent = `Retry Level ${this.level}`;
        }
    }

    advanceToNextStage() {
        if (this.level < 6) {
            window.location.href = `game.php?fresh=1`;
        } else {
            // Advance difficulty
            let nextDiff = 'Normal';
            if (this.difficulty === 'Normal') nextDiff = 'Hard';
            if (this.difficulty === 'Hard') nextDiff = 'Easy';

            fetch('../backend/actions/update_settings.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ difficulty: nextDiff })
            }).then(() => {
                window.location.href = 'game.php?fresh=1';
            });
        }
    }

    restartMission() {
        this.score = 0;
        this.catches = 0;
        this.timeLeft = this.diffConf.duration;
        this.missionStatus = 'playing';
        this.isPaused = false;
        this.pauseModal.style.display = 'none';
        this.outcomeModal.style.display = 'none';
        this.catchBanner.textContent = `Target: ${this.targetMarks.toLocaleString()} marks · Steer with mouse or A/D · Click or Space to drop hook`;
        if (window.soundEngine && this.settings.music) {
            window.soundEngine.startBGM();
        }
        this.initFishes();
        this.updateHUD();
    }

    // ========================================================
    // 7. CANVAS RENDERING ENGINE (60 FPS SMOOTH LOOP)
    // ========================================================
    render(now) {
        const dt = Math.min((now - this.sim.lastTime) / 1000, 0.05);
        this.sim.lastTime = now;

        const activeLure = LURE_STYLES[this.settings.lureStyle] || LURE_STYLES.biolum;

        // Wave surface equation
        const getWaveHeight = (x, t) =>
            WATER_SURFACE_Y +
            Math.sin(x * 0.018 + t * 2.1) * 3.5 +
            Math.cos(x * 0.032 - t * 1.6) * 2;

        // Update Physics if not paused
        if (!this.isPaused && !this.isOracleOpen && this.missionStatus === 'playing') {
            this.sim.time += dt;

            // Keyboard steering
            if (this.sim.keys.left) this.sim.targetBoatX -= 320 * dt;
            if (this.sim.keys.right) this.sim.targetBoatX += 320 * dt;
            this.sim.targetBoatX = Math.max(85, Math.min(LOGICAL_W - 85, this.sim.targetBoatX));

            const followRate = this.sim.hookState === 'idle' ? 0.14 : 0.04;
            this.sim.boatX += (this.sim.targetBoatX - this.sim.boatX) * followRate;

            const hookX = this.sim.boatX + 34;

            // Update fishes
            const levelSpeedBoost = 1 + (this.level - 1) * 0.06;
            this.sim.fishes.forEach((fish) => {
                fish.x += fish.dir * fish.speed * this.diffConf.speedMultiplier * levelSpeedBoost * 60 * dt;
                fish.y = fish.baseY + Math.sin(this.sim.time * 2.4 + fish.phase) * fish.bobAmp;

                if (fish.dir > 0 && fish.x > LOGICAL_W + 75) fish.x = -75;
                if (fish.dir < 0 && fish.x < -75) fish.x = LOGICAL_W + 75;
            });

            // Update jellyfish hazards
            this.sim.jellyfishes.forEach((j) => {
                j.x += j.dir * j.speed * 60 * dt;
                j.y = j.baseY + Math.sin(this.sim.time * 2 + j.phase) * 14;
                if (j.dir > 0 && j.x > LOGICAL_W + 50) j.x = -50;
                if (j.dir < 0 && j.x < -50) j.x = LOGICAL_W + 50;
            });

            // Update pearl oyster bonus
            if (this.sim.pearl) {
                this.sim.pearl.life -= dt;
                if (this.sim.pearl.life <= 0) {
                    this.sim.pearl = null;
                    this.sim.pearlCooldown = 7;
                }
            } else {
                this.sim.pearlCooldown -= dt;
                if (this.sim.pearlCooldown <= 0) {
                    this.sim.pearl = createPearlEntity();
                }
            }

            // Hook state machine & physics
            const restHookY = getWaveHeight(hookX, this.sim.time) + 12;

            if (this.sim.hookState === 'idle') {
                this.sim.hookY = restHookY;
            } else if (this.sim.hookState === 'dropping') {
                this.sim.hookY += this.diffConf.dropSpeed * 60 * dt;

                // Submerge splash
                if (!this.sim.wasSubmerged && this.sim.hookY > WATER_SURFACE_Y + 6) {
                    this.sim.wasSubmerged = true;
                    this.spawnParticles(hookX, WATER_SURFACE_Y + 2, '#bae6fd', 10, 2.4);
                }

                // Check Jellyfish collision
                for (const jelly of this.sim.jellyfishes) {
                    const dist = Math.hypot(hookX - jelly.x, this.sim.hookY - jelly.y);
                    if (dist < 26) {
                        this.sim.hookState = 'retracting';
                        const penalty = this.diffConf.zapPenalty || 75;
                        this.score = Math.max(0, this.score - penalty);
                        this.sim.shakeTime = 0.25;
                        this.updateHUD();
                        this.catchBanner.textContent = `⚡ Zapped by Jellyfish! -${penalty} marks`;
                        this.spawnParticles(jelly.x, jelly.y, '#fb7185', 18, 3.6);
                        this.spawnPopup(jelly.x, jelly.y - 16, `-${penalty} ZAP!`, '#fb7185', 16);
                        if (window.soundEngine) window.soundEngine.playZap();
                        break;
                    }
                }

                // Check Pearl collision
                if (this.sim.hookState === 'dropping' && this.sim.pearl) {
                    const pDist = Math.hypot(hookX - this.sim.pearl.x, this.sim.hookY - this.sim.pearl.y);
                    if (pDist < 26) {
                        this.sim.caughtEntity = { ...this.sim.pearl };
                        this.sim.pearl = null;
                        this.sim.pearlCooldown = 11;
                        this.sim.hookState = 'retracting';
                        this.spawnParticles(hookX, this.sim.hookY, '#fde047', 16, 3.2);
                        if (window.soundEngine) window.soundEngine.playCatch(true);
                    }
                }

                // Check Fish collision
                if (this.sim.hookState === 'dropping') {
                    for (let i = 0; i < this.sim.fishes.length; i++) {
                        const fish = this.sim.fishes[i];
                        const hitRadius = fish.species.sizeX * 0.72;
                        const dist = Math.hypot(hookX - fish.x, this.sim.hookY - fish.y);
                        if (dist < hitRadius) {
                            this.sim.caughtEntity = fish;
                            this.sim.fishes[i] = createFishEntity(pickNextSpecies(this.level), true);
                            this.sim.hookState = 'retracting';
                            this.spawnParticles(hookX, this.sim.hookY, fish.species.color, 14, 2.8);
                            if (window.soundEngine) {
                                window.soundEngine.playCatch(fish.species.rarity === 'Rare' || fish.species.rarity === 'Legendary');
                            }

                            // AUTOMATIC POPUP: Catching the special fish immediately pops up the Marc Conrad API Riddle!
                            if (fish.species.isSpecial || fish.species.id === 'oracle') {
                                this.catchBanner.textContent = '✨ Hooked Golden Oracle Fish! Marc Conrad API Challenge Activated!';
                                this.openOracleChallenge();
                            }
                            break;
                        }
                    }
                }

                // Reach seabed
                if (this.sim.hookState === 'dropping' && this.sim.hookY >= LOGICAL_H - 28) {
                    this.sim.hookState = 'retracting';
                    if (window.soundEngine) window.soundEngine.playMiss();
                }
            } else if (this.sim.hookState === 'retracting') {
                const weightFactor = this.sim.caughtEntity ? 0.85 : 1.1;
                this.sim.hookY -= this.diffConf.retractSpeed * weightFactor * 60 * dt;

                if (this.sim.caughtEntity) {
                    this.sim.caughtEntity.x = hookX;
                    this.sim.caughtEntity.y = this.sim.hookY + 14;
                }

                if (this.sim.hookY <= restHookY) {
                    this.sim.hookY = restHookY;
                    this.sim.hookState = 'idle';
                    this.sim.wasSubmerged = false;

                    if (this.sim.caughtEntity) {
                        this.spawnParticles(hookX, WATER_SURFACE_Y, '#e0f2fe', 12, 2.8);

                        if (this.sim.caughtEntity.kind === 'pearl') {
                            const bonusMarks = Math.round(250 * this.diffConf.scoreMultiplier);
                            this.score += bonusMarks;
                            this.timeLeft += 5;
                            this.updateHUD();
                            this.spawnPopup(hookX, WATER_SURFACE_Y - 10, `+${bonusMarks} & +5s!`, '#fde047', 17);
                            this.catchBanner.textContent = `✨ Sunken Pearl! +${bonusMarks} marks & +5s Time`;
                        } else {
                            const sp = this.sim.caughtEntity.species;
                            const earned = Math.round(sp.points * this.diffConf.scoreMultiplier);
                            this.score += earned;
                            this.catches += 1;
                            this.updateHUD();
                            this.spawnPopup(hookX, WATER_SURFACE_Y - 8, `+${earned}`, sp.color, 17);
                            this.catchBanner.textContent = `🎣 Caught ${sp.name} · +${earned} marks`;

                        }

                        this.sim.caughtEntity = null;

                        // Only complete the level if the riddle modal is not actively open
                        if (this.score >= this.targetMarks && !this.isOracleOpen) {
                            this.handleMissionOutcome();
                        }
                    }
                }
            }

            // Update rising bubbles
            this.sim.bubbles.forEach((b) => {
                b.y -= b.speed * 60 * dt;
                b.x += Math.sin(this.sim.time * 2 + b.wobble) * 0.22;
                if (b.y < WATER_SURFACE_Y + 6) {
                    b.y = LOGICAL_H - 18;
                    b.x = Math.random() * LOGICAL_W;
                }
            });

            // Update particles
            for (let i = this.sim.particles.length - 1; i >= 0; i--) {
                const p = this.sim.particles[i];
                p.x += p.vx * 60 * dt;
                p.y += p.vy * 60 * dt;
                p.life -= p.decay * 60 * dt;
                if (p.life <= 0) this.sim.particles.splice(i, 1);
            }

            // Update popups
            for (let i = this.sim.popups.length - 1; i >= 0; i--) {
                const pop = this.sim.popups[i];
                pop.y -= 34 * dt;
                pop.life -= 0.8 * dt;
                if (pop.life <= 0) this.sim.popups.splice(i, 1);
            }

            if (this.sim.shakeTime > 0) {
                this.sim.shakeTime = Math.max(0, this.sim.shakeTime - dt);
            }
        }

        // ========================================================
        // DRAWING ROUTINES
        // ========================================================
        const ctx = this.ctx;
        ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);

        ctx.save();
        if (this.sim.shakeTime > 0) {
            const mag = this.sim.shakeTime * 18;
            ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
        }

        // 1. Twilight Sky Band
        const skyGrad = ctx.createLinearGradient(0, 0, 0, WATER_SURFACE_Y + 8);
        skyGrad.addColorStop(0, '#041226');
        skyGrad.addColorStop(0.65, '#0b2d52');
        skyGrad.addColorStop(1, '#164e78');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, LOGICAL_W, WATER_SURFACE_Y + 8);

        // Moon & stars
        const moonGrad = ctx.createRadialGradient(130, 32, 3, 130, 32, 48);
        moonGrad.addColorStop(0, 'rgba(224, 242, 254, 0.9)');
        moonGrad.addColorStop(0.25, 'rgba(103, 232, 249, 0.3)');
        moonGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');
        ctx.fillStyle = moonGrad;
        ctx.beginPath();
        ctx.arc(130, 32, 48, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.arc(130, 32, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(224, 242, 254, 0.45)';
        [[240, 18], [370, 26], [520, 15], [670, 29], [790, 19]].forEach(([sx, sy]) => {
            ctx.beginPath();
            ctx.arc(sx, sy, 1.1, 0, Math.PI * 2);
            ctx.fill();
        });

        // 2. Deep Ocean Water Gradient
        const waterGrad = ctx.createLinearGradient(0, WATER_SURFACE_Y, 0, LOGICAL_H);
        waterGrad.addColorStop(0, '#0369a1');
        waterGrad.addColorStop(0.22, '#074674');
        waterGrad.addColorStop(0.62, '#042648');
        waterGrad.addColorStop(1, '#021024');
        ctx.fillStyle = waterGrad;
        ctx.fillRect(0, WATER_SURFACE_Y, LOGICAL_W, LOGICAL_H - WATER_SURFACE_Y);

        // 3. Volumetric Light Rays
        ctx.save();
        [140, 420, 690].forEach((rx, idx) => {
            const sway = Math.sin(this.sim.time * 0.6 + idx * 1.5) * 24;
            const rayGrad = ctx.createLinearGradient(rx, WATER_SURFACE_Y, rx - 40, LOGICAL_H);
            rayGrad.addColorStop(0, 'rgba(125, 211, 252, 0.14)');
            rayGrad.addColorStop(0.65, 'rgba(56, 189, 248, 0.04)');
            rayGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');
            ctx.fillStyle = rayGrad;
            ctx.beginPath();
            ctx.moveTo(rx - 30, WATER_SURFACE_Y);
            ctx.lineTo(rx + 45, WATER_SURFACE_Y);
            ctx.lineTo(rx + 125 + sway, LOGICAL_H);
            ctx.lineTo(rx - 95 + sway, LOGICAL_H);
            ctx.closePath();
            ctx.fill();
        });
        ctx.restore();

        // 4. Distant Reef Ridge & Kelp
        ctx.fillStyle = 'rgba(2, 18, 38, 0.72)';
        ctx.beginPath();
        ctx.moveTo(0, LOGICAL_H);
        ctx.lineTo(0, 405);
        ctx.quadraticCurveTo(130, 382, 260, 412);
        ctx.quadraticCurveTo(420, 430, 560, 392);
        ctx.quadraticCurveTo(720, 370, LOGICAL_W, 405);
        ctx.lineTo(LOGICAL_W, LOGICAL_H);
        ctx.closePath();
        ctx.fill();

        this.sim.kelp.forEach((k) => {
            const sway = Math.sin(this.sim.time * 1.8 + k.phase) * 10;
            ctx.strokeStyle = k.hue;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(k.x, LOGICAL_H);
            ctx.quadraticCurveTo(k.x + sway * 0.6, LOGICAL_H - k.height * 0.55, k.x + sway, LOGICAL_H - k.height);
            ctx.stroke();
        });

        // 5. Sandy Seabed
        const sandGrad = ctx.createLinearGradient(0, LOGICAL_H - 26, 0, LOGICAL_H);
        sandGrad.addColorStop(0, 'rgba(12, 45, 72, 0.9)');
        sandGrad.addColorStop(1, '#041426');
        ctx.fillStyle = sandGrad;
        ctx.beginPath();
        ctx.moveTo(0, LOGICAL_H - 12);
        ctx.quadraticCurveTo(220, LOGICAL_H - 24, 460, LOGICAL_H - 14);
        ctx.quadraticCurveTo(680, LOGICAL_H - 4, LOGICAL_W, LOGICAL_H - 18);
        ctx.lineTo(LOGICAL_W, LOGICAL_H);
        ctx.lineTo(0, LOGICAL_H);
        ctx.closePath();
        ctx.fill();

        // 6. Rising Bubbles
        this.sim.bubbles.forEach((b) => {
            ctx.strokeStyle = 'rgba(186, 230, 253, 0.35)';
            ctx.fillStyle = 'rgba(186, 230, 253, 0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });

        // 7. Aiming Sightline
        const hookX = this.sim.boatX + 34;
        if (this.sim.hookState === 'idle' && this.missionStatus === 'playing') {
            ctx.save();
            ctx.setLineDash([4, 6]);
            ctx.strokeStyle = 'rgba(103, 232, 249, 0.22)';
            ctx.lineWidth = 1.25;
            ctx.beginPath();
            ctx.moveTo(hookX, this.sim.hookY + 12);
            ctx.lineTo(hookX, LOGICAL_H - 24);
            ctx.stroke();
            ctx.restore();
        }

        // 8. Draw Pearls, Jellyfishes, Fishes
        if (this.sim.pearl) this.drawPearl(ctx, this.sim.pearl, this.sim.time);
        this.sim.jellyfishes.forEach((j) => this.drawJellyfish(ctx, j, this.sim.time));
        this.sim.fishes.forEach((fish) => this.drawFish(ctx, fish, this.sim.time, false));

        // 9. Draw Boat
        const boatSurfaceY = getWaveHeight(this.sim.boatX, this.sim.time);
        const boatSlope =
            (getWaveHeight(this.sim.boatX + 20, this.sim.time) - getWaveHeight(this.sim.boatX - 20, this.sim.time)) / 40;

        ctx.save();
        ctx.translate(this.sim.boatX, boatSurfaceY - 4);
        ctx.rotate(boatSlope * 0.75);

        // Shadow under boat
        ctx.fillStyle = 'rgba(2, 11, 24, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, 8, 56, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hull
        const hullGrad = ctx.createLinearGradient(0, -14, 0, 10);
        hullGrad.addColorStop(0, '#92400e');
        hullGrad.addColorStop(1, '#451a03');
        ctx.fillStyle = hullGrad;
        ctx.beginPath();
        ctx.moveTo(-58, -12);
        ctx.lineTo(62, -12);
        ctx.lineTo(44, 10);
        ctx.lineTo(-46, 10);
        ctx.closePath();
        ctx.fill();

        // Accent racing stripe
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-51, -8, 105, 2.5);

        // Wheelhouse cabin
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(-24, -34, 42, 22, [6, 6, 0, 0]);
        ctx.fill();

        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.roundRect(-28, -37, 50, 5, 3);
        ctx.fill();

        // Porthole window
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(-4, -23, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Fishing Rod
        const rodBend = this.sim.caughtEntity ? 10 : (this.sim.hookState === 'dropping' ? 3 : 0);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(16, -24);
        ctx.quadraticCurveTo(32, -40 + rodBend * 0.5, 34, -34 + rodBend);
        ctx.stroke();
        ctx.restore();

        // 10. Water Surface Wave
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, LOGICAL_H);
        ctx.lineTo(0, getWaveHeight(0, this.sim.time));
        for (let x = 0; x <= LOGICAL_W; x += 12) {
            ctx.lineTo(x, getWaveHeight(x, this.sim.time));
        }
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.55)';
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.restore();

        // 11. Fishing Line & Hook Lure
        const rodTipY = boatSurfaceY - 38 + (this.sim.caughtEntity ? 10 : 0);
        ctx.save();
        ctx.strokeStyle = activeLure.lineColor;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(hookX, rodTipY);
        ctx.lineTo(hookX, this.sim.hookY);
        ctx.stroke();

        ctx.shadowColor = activeLure.glowColor;
        ctx.shadowBlur = 12;
        ctx.fillStyle = activeLure.hookColor;
        ctx.beginPath();
        ctx.arc(hookX, this.sim.hookY, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = activeLure.hookColor;
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(hookX - 3, this.sim.hookY + 5, 6.5, 0, Math.PI * 1.15);
        ctx.stroke();
        ctx.restore();

        if (this.sim.caughtEntity) {
            if (this.sim.caughtEntity.kind === 'pearl') {
                this.drawPearl(ctx, this.sim.caughtEntity, this.sim.time);
            } else {
                this.drawFish(ctx, this.sim.caughtEntity, this.sim.time, true);
            }
        }

        // 12. Particles & Popups
        this.sim.particles.forEach((p) => {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        this.sim.popups.forEach((pop) => {
            ctx.save();
            ctx.globalAlpha = Math.max(0, pop.life);
            ctx.font = `800 ${pop.size}px Outfit, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(2, 11, 24, 0.75)';
            ctx.fillText(pop.text, pop.x + 1.5, pop.y + 1.5);
            ctx.fillStyle = pop.color;
            ctx.fillText(pop.text, pop.x, pop.y);
            ctx.restore();
        });

        ctx.restore();

        this.animationId = requestAnimationFrame((n) => this.render(n));
    }

    drawFish(ctx, fish, t, isHooked = false) {
        const { species, x, y, dir, phase } = fish;
        const wag = Math.sin(t * (isHooked ? 18 : 7.5) + phase);

        ctx.save();
        ctx.translate(x, y);
        if (isHooked) ctx.rotate(dir > 0 ? -Math.PI / 2.2 : Math.PI / 2.2);
        if (dir < 0) ctx.scale(-1, 1);

        // Rare & Legendary Glow Aura
        if (species.isSpecial || species.rarity === 'Legendary') {
            ctx.save();
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 24;
            ctx.fillStyle = 'rgba(251, 191, 36, 0.45)';
            ctx.beginPath();
            ctx.ellipse(0, 0, species.sizeX * 1.25, species.sizeY * 1.35, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else if (species.rarity === 'Mythic' || species.rarity === 'Rare') {
            ctx.save();
            ctx.shadowColor = species.color;
            ctx.shadowBlur = species.rarity === 'Mythic' ? 18 : 10;
            ctx.fillStyle = species.glow;
            ctx.beginPath();
            ctx.ellipse(0, 0, species.sizeX * 1.05, species.sizeY * 1.15, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Tail fin
        ctx.fillStyle = species.accentColor;
        ctx.beginPath();
        ctx.moveTo(-species.sizeX * 0.72, 0);
        ctx.quadraticCurveTo(
            -species.sizeX * 1.25,
            -species.sizeY * 0.85 + wag * (species.sizeY * 0.25),
            -species.sizeX * 1.45,
            -species.sizeY * 0.75 + wag * (species.sizeY * 0.3)
        );
        ctx.quadraticCurveTo(
            -species.sizeX * 1.15,
            wag * (species.sizeY * 0.1),
            -species.sizeX * 1.45,
            species.sizeY * 0.75 + wag * (species.sizeY * 0.3)
        );
        ctx.closePath();
        ctx.fill();

        // Dorsal fin
        ctx.fillStyle = species.accentColor;
        ctx.beginPath();
        ctx.moveTo(-species.sizeX * 0.25, -species.sizeY * 0.78);
        ctx.quadraticCurveTo(0, -species.sizeY * 1.45 + wag * (species.sizeY * 0.1), species.sizeX * 0.22, -species.sizeY * 0.8);
        ctx.closePath();
        ctx.fill();

        // Body gradient
        const bodyGrad = ctx.createLinearGradient(0, -species.sizeY, 0, species.sizeY);
        bodyGrad.addColorStop(0, species.accentColor);
        bodyGrad.addColorStop(0.45, species.color);
        bodyGrad.addColorStop(1, species.bellyColor);

        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, species.sizeX, species.sizeY, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eye
        const eyeX = species.sizeX * 0.56;
        const eyeY = -species.sizeY * 0.22;
        const eyeR = Math.max(2.2, species.sizeY * 0.22);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, eyeR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(eyeX + eyeR * 0.25, eyeY, eyeR * 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawJellyfish(ctx, jelly, t) {
        const pulse = Math.sin(t * 3.5 + jelly.phase);
        ctx.save();
        ctx.translate(jelly.x, jelly.y);

        const halo = ctx.createRadialGradient(0, 0, 6, 0, 0, 38);
        halo.addColorStop(0, 'rgba(244, 63, 94, 0.32)');
        halo.addColorStop(1, 'rgba(244, 63, 94, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, 38, 0, Math.PI * 2);
        ctx.fill();

        // Tentacles
        ctx.strokeStyle = 'rgba(251, 113, 133, 0.78)';
        ctx.lineWidth = 2;
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 5.5, 4);
            ctx.quadraticCurveTo(i * 7 + pulse * 5, 18, i * 5 - pulse * 4, 30 + Math.abs(i) * 2);
            ctx.stroke();
        }

        // Bell
        const bellGrad = ctx.createLinearGradient(0, -20, 0, 8);
        bellGrad.addColorStop(0, '#f43f5e');
        bellGrad.addColorStop(1, '#fb7185');
        ctx.fillStyle = bellGrad;
        ctx.beginPath();
        ctx.arc(0, 4, 18 + pulse * 1.8, Math.PI, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    drawPearl(ctx, pearl, t) {
        const glow = 0.75 + Math.sin(t * 4 + pearl.phase) * 0.25;
        ctx.save();
        ctx.translate(pearl.x, pearl.y + Math.sin(t * 2 + pearl.phase) * 4);

        const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, 26);
        aura.addColorStop(0, `rgba(253, 224, 71, ${0.55 * glow})`);
        aura.addColorStop(1, 'rgba(253, 224, 71, 0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0, Math.PI * 2);
        ctx.fill();

        // Shell base
        ctx.fillStyle = '#0f766e';
        ctx.beginPath();
        ctx.ellipse(0, 7, 15, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shiny Pearl
        const pearlGrad = ctx.createRadialGradient(-3, -3, 1, 0, 0, 10);
        pearlGrad.addColorStop(0, '#ffffff');
        pearlGrad.addColorStop(0.55, '#fef08a');
        pearlGrad.addColorStop(1, '#38bdf8');
        ctx.fillStyle = pearlGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 9.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    spawnParticles(x, y, color, count = 12, speed = 2.6) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const mag = (0.4 + Math.random() * 0.9) * speed;
            this.sim.particles.push({
                x,
                y,
                vx: Math.cos(angle) * mag,
                vy: Math.sin(angle) * mag - 0.6,
                r: 1.5 + Math.random() * 2.8,
                life: 1,
                decay: 0.02 + Math.random() * 0.02,
                color,
            });
        }
    }

    spawnPopup(x, y, text, color = '#67e8f9', size = 16) {
        this.sim.popups.push({
            x: Math.max(75, Math.min(LOGICAL_W - 75, x)),
            y,
            text,
            color,
            size,
            life: 1,
        });
    }
}

// Bootstrap game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gameApp = new FishCatcherGame();
});
