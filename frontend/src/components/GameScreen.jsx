import { useCallback, useEffect, useRef, useState } from 'react';
import PauseModal from './PauseModal';
import {
  AnchorHookIcon,
  PauseIcon,
  PlayIcon,
  SparklesIcon,
  TrophyIcon,
  VolumeOffIcon,
  VolumeOnIcon,
} from './Icons';
import {
  DIFFICULTY_CONFIG,
  FISH_SPECIES,
  LURE_STYLES,
} from '../utils/gameConfig';
import { soundEngine } from '../utils/sound';

const LOGICAL_W = 880;
const LOGICAL_H = 460;
const WATER_SURFACE_Y = 78;
const MISSION_DURATION = 60;
const LEVEL_STEP_SCORE = 750;

function createFishEntity(species, startOffscreen = false) {
  const dir = Math.random() > 0.5 ? 1 : -1;
  const x = startOffscreen
    ? dir > 0
      ? -70 - Math.random() * 60
      : LOGICAL_W + 70 + Math.random() * 60
    : 70 + Math.random() * (LOGICAL_W - 140);
  const y =
    species.minDepth +
    Math.random() * (species.maxDepth - species.minDepth);

  return {
    kind: 'fish',
    species,
    x,
    y,
    baseY: y,
    dir,
    speed: species.speedBase * (0.9 + Math.random() * 0.25),
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
    speed: 0.85 + Math.random() * 0.35,
    phase: Math.random() * Math.PI * 2,
  };
}

function createPearlEntity() {
  return {
    kind: 'pearl',
    x: 110 + Math.random() * (LOGICAL_W - 220),
    y: 355 + Math.random() * 45,
    phase: Math.random() * Math.PI * 2,
    life: 14, // seconds before relocating
  };
}

function createInitialFishes() {
  const pool = [
    FISH_SPECIES[0],
    FISH_SPECIES[0],
    FISH_SPECIES[1],
    FISH_SPECIES[1],
    FISH_SPECIES[2],
    FISH_SPECIES[3],
    FISH_SPECIES[4],
    FISH_SPECIES[5],
  ];
  return pool.map((sp) => createFishEntity(sp, false));
}

function pickNextSpecies(level) {
  const roll = Math.random();
  if (roll < 0.1 + Math.min(level * 0.025, 0.1)) return FISH_SPECIES[5]; // Biolume
  if (roll < 0.28) return FISH_SPECIES[4]; // Angelfish
  if (roll < 0.48) return FISH_SPECIES[3]; // Redfin
  if (roll < 0.68) return FISH_SPECIES[2]; // Barb
  if (roll < 0.85) return FISH_SPECIES[1]; // Tetra
  return FISH_SPECIES[0]; // Snapper
}

export default function GameScreen({
  settings,
  bestScore,
  onUpdateSettings,
  onMissionComplete,
  onReturnHome,
  onOpenLeaderboard,
}) {
  const canvasRef = useRef(null);

  const [runId, setRunId] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MISSION_DURATION);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(1);
  const [catches, setCatches] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [runStartBestScore, setRunStartBestScore] = useState(bestScore);
  const [runBestCombo, setRunBestCombo] = useState(1);
  const [lastCatchBanner, setLastCatchBanner] = useState(
    'Move mouse or A/D to steer boat · Click or Space to drop hook'
  );

  const gameOver = timeLeft <= 0;
  const isNewHighScore = gameOver && score > runStartBestScore && score > 0;

  const isPausedRef = useRef(isPaused);
  const gameOverRef = useRef(gameOver);
  const settingsRef = useRef(settings);
  const reportedRunRef = useRef(-1);

  const scoreRef = useRef(0);
  const catchesRef = useRef(0);
  const bestComboRef = useRef(1);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const restartMission = useCallback(() => {
    scoreRef.current = 0;
    catchesRef.current = 0;
    bestComboRef.current = 1;
    setScore(0);
    setTimeLeft(MISSION_DURATION);
    setLevel(1);
    setCombo(1);
    setCatches(0);
    setRunStartBestScore(bestScore);
    setRunBestCombo(1);
    setIsPaused(false);
    setLastCatchBanner(
      'Move mouse or A/D to steer boat · Click or Space to drop hook'
    );
    setRunId((id) => id + 1);
  }, [bestScore]);

  // Keyboard pause shortcut (Esc / P)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (gameOverRef.current) return;
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        e.preventDefault();
        soundEngine.playClick();
        setIsPaused((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Countdown Timer Effect
  useEffect(() => {
    if (gameOver || isPaused) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [gameOver, isPaused, runId]);

  // Report mission stats once when Game Over triggers
  useEffect(() => {
    if (gameOver && reportedRunRef.current !== runId) {
      reportedRunRef.current = runId;
      soundEngine.playGameOver();
      onMissionComplete({
        score: scoreRef.current,
        catches: catchesRef.current,
        bestCombo: bestComboRef.current,
      });
    }
  }, [gameOver, runId, onMissionComplete]);

  // Main Canvas Engine Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = LOGICAL_W * dpr;
    canvas.height = LOGICAL_H * dpr;

    const diffConf =
      DIFFICULTY_CONFIG[settingsRef.current.difficulty] || DIFFICULTY_CONFIG.Easy;

    const state = {
      time: 0,
      boatX: LOGICAL_W / 2,
      targetBoatX: LOGICAL_W / 2,
      hookY: WATER_SURFACE_Y + 14,
      hookState: 'idle', // 'idle' | 'dropping' | 'retracting'
      caughtEntity: null,
      fishes: createInitialFishes(),
      jellyfishes: Array.from({ length: diffConf.jellyfishCount }, (_, i) =>
        createJellyfishEntity(i)
      ),
      pearl: Math.random() < 0.6 ? createPearlEntity() : null,
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
      combo: 1,
      level: 1,
      score: 0,
      catches: 0,
      bestCombo: 1,
      wasSubmerged: false,
      lastTime: performance.now(),
    };

    const spawnParticles = (x, y, color, count = 12, speed = 2.6) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const mag = (0.4 + Math.random() * 0.9) * speed;
        state.particles.push({
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
    };

    const spawnPopup = (x, y, text, color = '#67e8f9', size = 16) => {
      state.popups.push({
        x: Math.max(75, Math.min(LOGICAL_W - 75, x)),
        y,
        text,
        color,
        size,
        life: 1,
      });
    };

    const getWaveHeight = (x, t) =>
      WATER_SURFACE_Y +
      Math.sin(x * 0.018 + t * 2.1) * 3.5 +
      Math.cos(x * 0.032 - t * 1.6) * 2;

    const triggerDrop = () => {
      if (isPausedRef.current || gameOverRef.current) return;
      if (state.hookState === 'idle') {
        state.hookState = 'dropping';
        soundEngine.playCast();
      }
    };

    const getCanvasX = (clientX) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = LOGICAL_W / rect.width;
      return Math.max(85, Math.min(LOGICAL_W - 85, (clientX - rect.left) * scaleX));
    };

    const handlePointerMove = (e) => {
      if (isPausedRef.current || gameOverRef.current) return;
      state.targetBoatX = getCanvasX(e.clientX);
    };

    const handlePointerDown = (e) => {
      if (isPausedRef.current || gameOverRef.current) return;
      const x = getCanvasX(e.clientX);
      state.targetBoatX = x;
      if (e.pointerType === 'touch' && state.hookState === 'idle') {
        state.boatX = x;
      }
      triggerDrop();
    };

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        state.keys.left = true;
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        state.keys.right = true;
      } else if (e.key === ' ' || e.key === 'ArrowDown') {
        if (!isPausedRef.current && !gameOverRef.current) {
          e.preventDefault();
          triggerDrop();
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        state.keys.left = false;
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        state.keys.right = false;
      }
    };

    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const drawFish = (fish, t, isHooked = false) => {
      const { species, x, y, dir, phase } = fish;
      const wag = Math.sin(t * (isHooked ? 18 : 7.5) + phase);

      ctx.save();
      ctx.translate(x, y);
      if (isHooked) {
        ctx.rotate(dir > 0 ? -Math.PI / 2.2 : Math.PI / 2.2);
      }
      if (dir < 0) {
        ctx.scale(-1, 1);
      }

      // Soft bioluminescent aura for Rare / Mythic species
      if (species.rarity === 'Mythic' || species.rarity === 'Rare') {
        ctx.save();
        ctx.shadowColor = species.color;
        ctx.shadowBlur = species.rarity === 'Mythic' ? 18 : 10;
        ctx.fillStyle = species.glow;
        ctx.beginPath();
        ctx.ellipse(0, 0, species.sizeX * 1.05, species.sizeY * 1.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Tail fin with smooth sinusoidal wag
      ctx.fillStyle = species.accentColor;
      ctx.beginPath();
      ctx.moveTo(-species.sizeX * 0.72, 0);
      ctx.quadraticCurveTo(
        -species.sizeX - 10,
        -species.sizeY * 0.85 + wag * 5,
        -species.sizeX - 16,
        -species.sizeY * 0.75 + wag * 6
      );
      ctx.quadraticCurveTo(
        -species.sizeX - 6,
        wag * 2,
        -species.sizeX - 16,
        species.sizeY * 0.75 + wag * 6
      );
      ctx.closePath();
      ctx.fill();

      // Dorsal Fin
      ctx.fillStyle = species.accentColor;
      ctx.beginPath();
      ctx.moveTo(-species.sizeX * 0.25, -species.sizeY * 0.78);
      ctx.quadraticCurveTo(
        0,
        -species.sizeY * 1.45 + wag * 1.5,
        species.sizeX * 0.22,
        -species.sizeY * 0.8
      );
      ctx.closePath();
      ctx.fill();

      // Main fish body gradient
      const bodyGrad = ctx.createLinearGradient(0, -species.sizeY, 0, species.sizeY);
      bodyGrad.addColorStop(0, species.accentColor);
      bodyGrad.addColorStop(0.45, species.color);
      bodyGrad.addColorStop(1, species.bellyColor);

      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, species.sizeX, species.sizeY, 0, 0, Math.PI * 2);
      ctx.fill();

      // Unique Lateral Stripes / Markings
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, 0, species.sizeX, species.sizeY, 0, 0, Math.PI * 2);
      ctx.clip();

      ctx.fillStyle = species.accentColor;
      ctx.globalAlpha = 0.42;
      ctx.beginPath();
      ctx.ellipse(-species.sizeX * 0.12, 0, species.sizeX * 0.18, species.sizeY * 0.95, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-species.sizeX * 0.42, 0, species.sizeX * 0.12, species.sizeY * 0.85, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Iridescent top sheen
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(species.sizeX * 0.08, -species.sizeY * 0.42, species.sizeX * 0.6, species.sizeY * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Pectoral fin
      ctx.fillStyle = species.bellyColor;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.ellipse(species.sizeX * 0.12, species.sizeY * 0.28, 9, 4.5, 0.45 + wag * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Eye
      const eyeX = species.sizeX * 0.56;
      const eyeY = -species.sizeY * 0.22;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, 4.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.arc(eyeX + 1.1, eyeY, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(eyeX + 1.8, eyeY - 0.9, 0.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawJellyfish = (jelly, t) => {
      const pulse = Math.sin(t * 3.5 + jelly.phase);
      ctx.save();
      ctx.translate(jelly.x, jelly.y);

      // Warning halo
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
        ctx.quadraticCurveTo(
          i * 7 + pulse * 5,
          18,
          i * 5 - pulse * 4,
          30 + Math.abs(i) * 2
        );
        ctx.stroke();
      }

      // Bell dome
      const bellGrad = ctx.createLinearGradient(0, -20, 0, 8);
      bellGrad.addColorStop(0, '#f43f5e');
      bellGrad.addColorStop(1, '#fb7185');
      ctx.fillStyle = bellGrad;
      ctx.beginPath();
      ctx.arc(0, 4, 18 + pulse * 1.8, Math.PI, 0);
      ctx.closePath();
      ctx.fill();

      // Inner bioluminescent spots
      ctx.fillStyle = 'rgba(255, 228, 230, 0.75)';
      ctx.beginPath();
      ctx.arc(-5, -5, 2.3, 0, Math.PI * 2);
      ctx.arc(5, -6, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawPearl = (pearl, t) => {
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

      // Shell halves
      ctx.fillStyle = '#0f766e';
      ctx.beginPath();
      ctx.ellipse(0, 7, 15, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glowing pearl
      const pearlGrad = ctx.createRadialGradient(-3, -3, 1, 0, 0, 10);
      pearlGrad.addColorStop(0, '#ffffff');
      pearlGrad.addColorStop(0.55, '#fef08a');
      pearlGrad.addColorStop(1, '#38bdf8');
      ctx.fillStyle = pearlGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 9.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    let animationFrameId;

    const render = (now) => {
      const dt = Math.min((now - state.lastTime) / 1000, 0.05);
      state.lastTime = now;

      const activeSettings = settingsRef.current;
      const activeDiff =
        DIFFICULTY_CONFIG[activeSettings.difficulty] || DIFFICULTY_CONFIG.Easy;
      const activeLure =
        LURE_STYLES[activeSettings.lureStyle] || LURE_STYLES.biolum;

      if (!isPausedRef.current && !gameOverRef.current) {
        state.time += dt;

        // Keyboard boat steering
        if (state.keys.left) state.targetBoatX -= 320 * dt;
        if (state.keys.right) state.targetBoatX += 320 * dt;
        state.targetBoatX = Math.max(85, Math.min(LOGICAL_W - 85, state.targetBoatX));

        // Smooth boat tracking when hook is idle (gentle inertia when reeling)
        const followRate = state.hookState === 'idle' ? 0.14 : 0.04;
        state.boatX += (state.targetBoatX - state.boatX) * followRate;

        const hookX = state.boatX + 34;

        // Update fishes
        const levelSpeedBoost = 1 + (state.level - 1) * 0.09;
        state.fishes.forEach((fish) => {
          fish.x +=
            fish.dir *
            fish.speed *
            activeDiff.speedMultiplier *
            levelSpeedBoost *
            60 *
            dt;
          fish.y = fish.baseY + Math.sin(state.time * 2.4 + fish.phase) * fish.bobAmp;

          if (fish.dir > 0 && fish.x > LOGICAL_W + 75) {
            fish.x = -75;
          } else if (fish.dir < 0 && fish.x < -75) {
            fish.x = LOGICAL_W + 75;
          }
        });

        // Update jellyfish hazards
        const targetJellyCount = activeDiff.jellyfishCount;
        while (state.jellyfishes.length < targetJellyCount) {
          state.jellyfishes.push(createJellyfishEntity(state.jellyfishes.length));
        }
        if (state.jellyfishes.length > targetJellyCount) {
          state.jellyfishes.length = targetJellyCount;
        }
        state.jellyfishes.forEach((j) => {
          j.x += j.dir * j.speed * 60 * dt;
          j.y = j.baseY + Math.sin(state.time * 2 + j.phase) * 14;
          if (j.dir > 0 && j.x > LOGICAL_W + 50) j.x = -50;
          if (j.dir < 0 && j.x < -50) j.x = LOGICAL_W + 50;
        });

        // Update pearl bonus
        if (state.pearl) {
          state.pearl.life -= dt;
          if (state.pearl.life <= 0) {
            state.pearl = null;
            state.pearlCooldown = 7;
          }
        } else {
          state.pearlCooldown -= dt;
          if (state.pearlCooldown <= 0) {
            state.pearl = createPearlEntity();
          }
        }

        // Hook physics & collisions
        const restHookY = getWaveHeight(hookX, state.time) + 12;

        if (state.hookState === 'idle') {
          state.hookY = restHookY;
        } else if (state.hookState === 'dropping') {
          state.hookY += activeDiff.dropSpeed * 60 * dt;

          // Surface splash check
          if (!state.wasSubmerged && state.hookY > WATER_SURFACE_Y + 6) {
            state.wasSubmerged = true;
            spawnParticles(hookX, WATER_SURFACE_Y + 2, '#bae6fd', 10, 2.4);
          }

          // Check Jellyfish collision first
          for (const jelly of state.jellyfishes) {
            const dist = Math.hypot(hookX - jelly.x, state.hookY - jelly.y);
            if (dist < 26) {
              state.hookState = 'retracting';
              state.combo = 1;
              state.score = Math.max(0, state.score - 75);
              state.shakeTime = 0.25;
              scoreRef.current = state.score;
              setScore(state.score);
              setCombo(1);
              setLastCatchBanner('⚡ Zapped by Electric Jellyfish! -75 pts · Combo reset');
              spawnParticles(jelly.x, jelly.y, '#fb7185', 18, 3.6);
              spawnPopup(jelly.x, jelly.y - 16, '-75 ZAP!', '#fb7185', 16);
              soundEngine.playZap();
              break;
            }
          }

          // Check Pearl collision
          if (state.hookState === 'dropping' && state.pearl) {
            const pDist = Math.hypot(hookX - state.pearl.x, state.hookY - state.pearl.y);
            if (pDist < 26) {
              state.caughtEntity = { ...state.pearl };
              state.pearl = null;
              state.pearlCooldown = 11;
              state.hookState = 'retracting';
              spawnParticles(hookX, state.hookY, '#fde047', 16, 3.2);
              soundEngine.playCatch(state.combo, true);
            }
          }

          // Check Fish collision
          if (state.hookState === 'dropping') {
            for (let i = 0; i < state.fishes.length; i++) {
              const fish = state.fishes[i];
              const hitRadius = fish.species.sizeX * 0.72;
              const dist = Math.hypot(hookX - fish.x, state.hookY - fish.y);
              if (dist < hitRadius) {
                state.caughtEntity = fish;
                state.fishes[i] = createFishEntity(pickNextSpecies(state.level), true);
                state.hookState = 'retracting';
                spawnParticles(hookX, state.hookY, fish.species.color, 14, 2.8);
                soundEngine.playCatch(
                  state.combo,
                  fish.species.rarity === 'Rare' || fish.species.rarity === 'Mythic'
                );
                break;
              }
            }
          }

          // Bottom miss
          if (state.hookState === 'dropping' && state.hookY >= LOGICAL_H - 28) {
            state.hookState = 'retracting';
            if (state.combo > 1) {
              spawnPopup(hookX, LOGICAL_H - 46, 'Combo Lost', '#94a3b8', 13);
            }
            state.combo = 1;
            setCombo(1);
            soundEngine.playMiss();
          }
        } else if (state.hookState === 'retracting') {
          const weightFactor = state.caughtEntity ? 0.85 : 1.1;
          state.hookY -= activeDiff.retractSpeed * weightFactor * 60 * dt;

          if (state.caughtEntity) {
            state.caughtEntity.x = hookX;
            state.caughtEntity.y = state.hookY + 14;
          }

          if (state.hookY <= restHookY) {
            state.hookY = restHookY;
            state.hookState = 'idle';
            state.wasSubmerged = false;

            if (state.caughtEntity) {
              spawnParticles(hookX, WATER_SURFACE_Y, '#e0f2fe', 12, 2.8);

              if (state.caughtEntity.kind === 'pearl') {
                const bonusPts = Math.round(250 * activeDiff.scoreMultiplier);
                state.score += bonusPts;
                scoreRef.current = state.score;
                setScore(state.score);
                setTimeLeft((prev) => prev + 5);
                spawnPopup(hookX, WATER_SURFACE_Y - 10, `+${bonusPts} & +5s!`, '#fde047', 17);
                setLastCatchBanner(`✨ Reeled Sunken Pearl! +${bonusPts} pts & +5s Time`);
              } else {
                const sp = state.caughtEntity.species;
                const comboMult = 1 + Math.min(state.combo - 1, 4) * 0.25;
                const earned = Math.round(
                  sp.points * activeDiff.scoreMultiplier * comboMult
                );
                state.score += earned;
                state.catches += 1;
                state.combo += 1;
                state.bestCombo = Math.max(state.bestCombo, state.combo - 1);

                scoreRef.current = state.score;
                catchesRef.current = state.catches;
                bestComboRef.current = state.bestCombo;

                setScore(state.score);
                setCatches(state.catches);
                setCombo(state.combo);
                setRunBestCombo(state.bestCombo);

                const newLevel = Math.floor(state.score / LEVEL_STEP_SCORE) + 1;
                if (newLevel > state.level) {
                  state.level = newLevel;
                  setLevel(newLevel);
                  soundEngine.playLevelUp();
                  spawnPopup(
                    LOGICAL_W / 2,
                    LOGICAL_H * 0.36,
                    `DEPTH LEVEL ${newLevel}!`,
                    '#38bdf8',
                    22
                  );
                }

                const comboTag =
                  state.combo > 2 ? ` (x${comboMult.toFixed(2).replace(/\.00$/, '')})` : '';
                spawnPopup(
                  hookX,
                  WATER_SURFACE_Y - 8,
                  `+${earned}${comboTag}`,
                  sp.color,
                  17
                );
                setLastCatchBanner(
                  `🎣 Caught ${sp.name} · +${earned} pts${
                    state.combo > 2 ? ` · ${state.combo - 1}x Streak!` : ''
                  }`
                );
              }

              state.caughtEntity = null;
            }
          }
        }

        // Update bubbles
        state.bubbles.forEach((b) => {
          b.y -= b.speed * 60 * dt;
          b.x += Math.sin(state.time * 2 + b.wobble) * 0.22;
          if (b.y < WATER_SURFACE_Y + 6) {
            b.y = LOGICAL_H - 18;
            b.x = Math.random() * LOGICAL_W;
          }
        });

        // Update particles
        for (let i = state.particles.length - 1; i >= 0; i--) {
          const p = state.particles[i];
          p.x += p.vx * 60 * dt;
          p.y += p.vy * 60 * dt;
          p.life -= p.decay * 60 * dt;
          if (p.life <= 0) state.particles.splice(i, 1);
        }

        // Update popups
        for (let i = state.popups.length - 1; i >= 0; i--) {
          const pop = state.popups[i];
          pop.y -= 34 * dt;
          pop.life -= 0.8 * dt;
          if (pop.life <= 0) state.popups.splice(i, 1);
        }

        if (state.shakeTime > 0) {
          state.shakeTime = Math.max(0, state.shakeTime - dt);
        }
      }

      // ================= RENDERING =================
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);

      ctx.save();
      if (state.shakeTime > 0) {
        const mag = state.shakeTime * 18;
        ctx.translate(
          (Math.random() - 0.5) * mag,
          (Math.random() - 0.5) * mag
        );
      }

      // 1. Twilight Sky Band (y = 0 .. WATER_SURFACE_Y)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, WATER_SURFACE_Y + 8);
      skyGrad.addColorStop(0, '#041226');
      skyGrad.addColorStop(0.65, '#0b2d52');
      skyGrad.addColorStop(1, '#164e78');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, LOGICAL_W, WATER_SURFACE_Y + 8);

      // Moon & atmospheric glow
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

      // Subtle sky stars
      ctx.fillStyle = 'rgba(224, 242, 254, 0.45)';
      [
        [240, 18],
        [370, 26],
        [520, 15],
        [670, 29],
        [790, 19],
      ].forEach(([sx, sy]) => {
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

      // 3. Volumetric Underwater Light Rays
      ctx.save();
      [140, 420, 690].forEach((rx, idx) => {
        const sway = Math.sin(state.time * 0.6 + idx * 1.5) * 24;
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

      // 4. Distant Reef Ridge Silhouette
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

      // 5. Swaying Seaweed / Kelp along ocean floor
      state.kelp.forEach((k) => {
        const sway = Math.sin(state.time * 1.8 + k.phase) * 10;
        ctx.strokeStyle = k.hue;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(k.x, LOGICAL_H);
        ctx.quadraticCurveTo(
          k.x + sway * 0.6,
          LOGICAL_H - k.height * 0.55,
          k.x + sway,
          LOGICAL_H - k.height
        );
        ctx.stroke();
      });

      // Sandy ocean floor
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
      state.bubbles.forEach((b) => {
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.35)';
        ctx.fillStyle = 'rgba(186, 230, 253, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      // 7. Subtle vertical sightline when hook is idle
      const hookX = state.boatX + 34;
      if (state.hookState === 'idle' && !gameOverRef.current) {
        ctx.save();
        ctx.setLineDash([4, 6]);
        ctx.strokeStyle = 'rgba(103, 232, 249, 0.22)';
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(hookX, state.hookY + 12);
        ctx.lineTo(hookX, LOGICAL_H - 24);
        ctx.stroke();
        ctx.restore();
      }

      // 8. Pearl Bonus & Jellyfish Hazards & Fishes
      if (state.pearl) {
        drawPearl(state.pearl, state.time);
      }
      state.jellyfishes.forEach((j) => drawJellyfish(j, state.time));
      state.fishes.forEach((fish) => drawFish(fish, state.time, false));

      // 9. Animated Fishing Boat at Surface
      const boatSurfaceY = getWaveHeight(state.boatX, state.time);
      const boatSlope =
        (getWaveHeight(state.boatX + 20, state.time) -
          getWaveHeight(state.boatX - 20, state.time)) /
        40;

      ctx.save();
      ctx.translate(state.boatX, boatSurfaceY - 4);
      ctx.rotate(boatSlope * 0.75);

      // Hull shadow
      ctx.fillStyle = 'rgba(2, 11, 24, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 8, 56, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hull body
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

      // Cyan trim stripe on hull
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-51, -8, 105, 2.5);

      // Cabin
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(-24, -34, 42, 22, [6, 6, 0, 0]);
      ctx.fill();

      // Cabin roof
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(-28, -37, 50, 5, 3);
      ctx.fill();

      // Glowing Porthole Window
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(-4, -23, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Fishing rod extending toward hookX
      const rodBend = state.caughtEntity ? 10 : state.hookState === 'dropping' ? 3 : 0;
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(16, -24);
      ctx.quadraticCurveTo(32, -40 + rodBend * 0.5, 34, -34 + rodBend);
      ctx.stroke();

      ctx.restore();

      // 10. Animated Surface Wave Lines (drawn over hull waterline for natural immersion)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, LOGICAL_H);
      ctx.lineTo(0, getWaveHeight(0, state.time));
      for (let x = 0; x <= LOGICAL_W; x += 12) {
        ctx.lineTo(x, getWaveHeight(x, state.time));
      }
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.55)';
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.restore();

      // 11. Fishing Line & Hook (using equipped Lure Style)
      const rodTipY = boatSurfaceY - 38 + (state.caughtEntity ? 10 : 0);
      ctx.save();
      ctx.strokeStyle = activeLure.lineColor;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(hookX, rodTipY);
      ctx.lineTo(hookX, state.hookY);
      ctx.stroke();

      // Hook glow + anchor
      ctx.shadowColor = activeLure.glowColor;
      ctx.shadowBlur = 12;
      ctx.fillStyle = activeLure.hookColor;
      ctx.beginPath();
      ctx.arc(hookX, state.hookY, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = activeLure.hookColor;
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(hookX - 3, state.hookY + 5, 6.5, 0, Math.PI * 1.15);
      ctx.stroke();
      ctx.restore();

      // Draw caught fish/pearl attached to hook while reeling up
      if (state.caughtEntity) {
        if (state.caughtEntity.kind === 'pearl') {
          drawPearl(state.caughtEntity, state.time);
        } else {
          drawFish(state.caughtEntity, state.time, true);
        }
      }

      // 12. Particles
      state.particles.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 13. Floating Score & Status Popups
      state.popups.forEach((pop) => {
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

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [runId]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const comboDisplay = combo > 1 ? `x${(1 + Math.min(combo - 1, 4) * 0.25).toFixed(2).replace(/\.00$/, '')}` : 'x1';
  const levelProgress = ((score % LEVEL_STEP_SCORE) / LEVEL_STEP_SCORE) * 100;
  const isAudioMuted = !settings.sfx && !settings.music;

  const toggleQuickMute = () => {
    soundEngine.playClick();
    if (isAudioMuted) {
      onUpdateSettings({ ...settings, sfx: true, music: true });
    } else {
      onUpdateSettings({ ...settings, sfx: false, music: false });
    }
  };

  return (
    <div className="w-full max-w-[960px] mx-auto px-3 sm:px-4 py-4 animate-modal-enter">
      <div className="glass-panel rounded-[28px] p-4 sm:p-5 relative overflow-hidden">
        <div className="absolute top-0 inset-x-16 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />

        {/* Modern HUD Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setIsPaused(true);
              }}
              className="btn-ocean-secondary h-10 px-3.5 rounded-xl flex items-center gap-2 text-xs font-bold cursor-pointer"
            >
              <PauseIcon className="w-3.5 h-3.5 text-cyan-300" />
              <span>Pause</span>
            </button>

            <button
              type="button"
              onClick={toggleQuickMute}
              aria-label={isAudioMuted ? 'Unmute audio' : 'Mute audio'}
              title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
              className="btn-ocean-secondary w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer"
            >
              {isAudioMuted ? (
                <VolumeOffIcon className="w-4 h-4 text-slate-400" />
              ) : (
                <VolumeOnIcon className="w-4 h-4 text-cyan-300" />
              )}
            </button>
          </div>

          {/* Center Stats Pills */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="glass-subcard px-3.5 py-1.5 rounded-xl flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                Score
              </span>
              <span className="text-base sm:text-lg font-extrabold text-white font-mono tabular-nums">
                {score.toLocaleString()}
              </span>
            </div>

            <div
              className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold font-mono tabular-nums transition-colors ${
                combo > 2
                  ? 'bg-amber-400/20 border-amber-300/45 text-amber-200'
                  : 'glass-subcard text-cyan-300'
              }`}
            >
              Combo {comboDisplay}
            </div>

            <div className="glass-subcard px-3.5 py-1.5 rounded-xl flex flex-col justify-center min-w-[92px]">
              <div className="flex items-center justify-between gap-2 text-xs font-bold">
                <span className="text-cyan-300">Lv. {level}</span>
                <span className="text-[10px] text-slate-400">
                  {Math.round(levelProgress)}%
                </span>
              </div>
              <div className="w-full h-1 rounded-full bg-slate-900 mt-1 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-teal-300 transition-all duration-300"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Countdown Timer */}
          <div
            className={`px-4 py-1.5 rounded-xl border font-mono font-extrabold text-base sm:text-lg tabular-nums transition-all ${
              timeLeft <= 10
                ? 'bg-rose-500/25 border-rose-400/60 text-rose-200 animate-pulse'
                : timeLeft <= 20
                ? 'bg-amber-500/20 border-amber-400/45 text-amber-200'
                : 'glass-subcard text-white'
            }`}
          >
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Canvas Arena */}
        <div className="relative w-full aspect-[880/460] rounded-2xl overflow-hidden border border-cyan-300/25 shadow-[0_18px_45px_rgba(1,8,20,0.75)] bg-[#021024]">
          <canvas
            ref={canvasRef}
            className="w-full h-full block cursor-crosshair touch-none"
          />

          {/* Live Catch Feed / Controls Pill */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 max-w-[92%] px-4 py-1.5 rounded-full bg-[#020b18]/75 backdrop-blur-md border border-cyan-300/25 text-[11px] sm:text-xs font-semibold text-cyan-100 pointer-events-none truncate shadow-lg">
            {lastCatchBanner}
          </div>
        </div>

        {/* Pause Modal */}
        {isPaused && !gameOver && (
          <PauseModal
            onResume={() => setIsPaused(false)}
            onNewGame={restartMission}
            onReturnHome={onReturnHome}
            settings={settings}
            onUpdateSettings={onUpdateSettings}
          />
        )}

        {/* Mission Complete Modal */}
        {gameOver && (
          <div className="absolute inset-0 bg-[#020b18]/80 backdrop-blur-md rounded-[28px] flex items-center justify-center p-4 z-20">
            <div className="glass-panel rounded-3xl p-7 w-full max-w-[440px] flex flex-col items-center text-center relative animate-modal-enter">
              <div className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />

              {isNewHighScore ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/45 text-amber-200 text-xs font-bold uppercase tracking-wider mb-3">
                  <SparklesIcon className="w-3.5 h-3.5" />
                  <span>New Personal Best!</span>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-cyan-400/15 border border-cyan-300/30 text-cyan-300 flex items-center justify-center mb-3">
                  <AnchorHookIcon className="w-6 h-6" />
                </div>
              )}

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">
                Mission Complete
              </h2>
              <p className="text-xs text-slate-400 mb-5">
                Expedition log recorded on {settings.difficulty} currents.
              </p>

              <div className="glass-subcard w-full rounded-2xl p-4 mb-4">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Final Score
                </div>
                <div className="text-4xl font-extrabold text-cyan-300 font-mono tabular-nums mt-0.5">
                  {score.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Personal Best: {Math.max(bestScore, score).toLocaleString()} pts
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 w-full mb-6">
                <div className="glass-subcard rounded-xl p-2.5">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">
                    Catches
                  </div>
                  <div className="text-base font-extrabold text-white tabular-nums">
                    {catches}
                  </div>
                </div>
                <div className="glass-subcard rounded-xl p-2.5">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">
                    Peak Streak
                  </div>
                  <div className="text-base font-extrabold text-amber-300 tabular-nums">
                    {runBestCombo}x
                  </div>
                </div>
                <div className="glass-subcard rounded-xl p-2.5">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">
                    Depth Lv.
                  </div>
                  <div className="text-base font-extrabold text-cyan-300 tabular-nums">
                    {level}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 w-full">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    restartMission();
                  }}
                  className="btn-ocean-primary flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <PlayIcon className="w-4 h-4" />
                  <span>Hunt Again</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onOpenLeaderboard();
                  }}
                  className="btn-ocean-secondary h-11 px-4 rounded-xl flex items-center justify-center gap-1.5 text-sm font-semibold cursor-pointer"
                >
                  <TrophyIcon className="w-4 h-4 text-amber-300" />
                  <span>Ranks</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onReturnHome();
                  }}
                  className="btn-ocean-secondary h-11 px-4 rounded-xl flex items-center justify-center text-sm font-semibold cursor-pointer"
                >
                  Hub
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
