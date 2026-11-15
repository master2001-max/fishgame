<?php
/**
 * Game Arena View
 * File: game.php
 * 
 * Demonstrates:
 * - HTML5 Canvas Arcade Rendering with Vanilla JavaScript.
 * - Event-Driven Programming: Canvas input, keyboard controls, audio hooks.
 * - Third-Party Interoperability: Marc Conrad Oracle riddle modal.
 * - Virtual Identity: Loads player difficulty, level progress, and sessions.
 */

require_once __DIR__ . '/../backend/config/database.php';
requireAuth();

$userId = (int)$_SESSION['user_id'];
$pdo = getDBConnection();

$stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id LIMIT 1");
$stmt->execute([':id' => $userId]);
$user = $stmt->fetch();

$progress = json_decode($user['progress'] ?? '{}', true) ?? getDefaultProgress();
$settings = json_decode($user['settings'] ?? '{}', true) ?? getDefaultSettings();

$isResume = !empty($_GET['resume']);
$isFresh  = !empty($_GET['fresh']);

if ($isFresh) {
    // Player explicitly chose to start fresh, clear saved game session
    $clear = $pdo->prepare("UPDATE users SET saved_game = NULL WHERE id = :id");
    $clear->execute([':id' => $userId]);
    $user['saved_game'] = null;
}

$savedGame = ($isResume && !empty($user['saved_game'])) ? json_decode($user['saved_game'], true) : null;

$activeDifficulty = $savedGame['difficulty'] ?? ($settings['difficulty'] ?? ($user['difficulty'] ?? 'Easy'));
if (!in_array($activeDifficulty, ['Easy', 'Normal', 'Hard'])) {
    $activeDifficulty = 'Easy';
}

$diffProgress = $progress[$activeDifficulty] ?? ['currentLevel' => 1, 'completed' => []];
$level = $savedGame['level'] ?? (int)$diffProgress['currentLevel'];
$level = max(1, min(6, $level));

// Level target marks per difficulty
$targets = [
    'Easy'   => [350, 500, 650, 850, 1050, 1250],
    'Normal' => [800, 1100, 1400, 1700, 2000, 2300],
    'Hard'   => [1400, 1800, 2150, 2500, 2850, 3200],
];
$targetMarks = $targets[$activeDifficulty][$level - 1] ?? 500;

$pageTitle = "Fish Catcher - {$activeDifficulty} Lv. {$level}";
require_once __DIR__ . '/includes/header.php';
?>

<!-- Pass PHP Session & Game Configuration to Vanilla JavaScript -->
<script>
window.GAME_BOOTSTRAP = {
    userId: <?= $userId ?>,
    difficulty: "<?= $activeDifficulty ?>",
    level: <?= $level ?>,
    targetMarks: <?= $targetMarks ?>,
    bestScore: <?= (int)$user['score'] ?>,
    resumeSession: <?= $savedGame ? json_encode($savedGame) : 'null' ?>,
    settings: <?= json_encode($settings) ?>
};
</script>

<div class="game-viewport">
    <div class="glass-panel" style="padding: 20px; position: relative;">
        <div class="top-glow-line"></div>

        <!-- Target-Based HUD Bar -->
        <div class="game-hud">
            <div class="hud-left">
                <button type="button" id="pauseBtn" class="btn-ocean-secondary" style="height: 40px; padding: 0 16px; font-size: 13px; font-weight: 700;">
                    <svg viewBox="0 0 24 24" fill="currentColor" style="width: 14px; height: 14px; color: #67e8f9;">
                        <rect x="6" y="4" width="4.5" height="16" rx="1.5" />
                        <rect x="13.5" y="4" width="4.5" height="16" rx="1.5" />
                    </svg>
                    <span>Pause</span>
                </button>

                <button type="button" id="muteBtn" class="btn-ocean-secondary" style="width: 40px; height: 40px; padding: 0;" aria-label="Toggle Audio">
                    <svg id="muteIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px; color: #67e8f9;">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                </button>
            </div>

            <!-- Center Stage & Target Marks Progress -->
            <div class="hud-center">
                <div class="glass-subcard hud-pill">
                    <?= $activeDifficulty ?> · Lv. <?= $level ?>/6
                </div>

                <div class="glass-subcard target-progress-box">
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 12px; font-weight: 700;">
                        <span style="color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em;">
                            Marks Target
                        </span>
                        <span class="font-mono tabular-nums" style="color: #fff;">
                            <span id="hudScore" style="color: #67e8f9; font-weight: 800;">0</span>
                            <span style="color: #64748b;"> / <?= number_format($targetMarks) ?></span>
                        </span>
                    </div>
                    <div class="progress-bar-track">
                        <div id="hudProgressBar" class="progress-bar-fill" style="width: 0%;"></div>
                    </div>
                </div>
            </div>

            <!-- Countdown Timer -->
            <div id="hudTimer" class="timer-box font-mono tabular-nums">
                01:30
            </div>
        </div>

        <!-- HTML5 Canvas Game Arena -->
        <div class="canvas-wrapper">
            <canvas id="gameCanvas" width="880" height="460"></canvas>
            <div id="catchBanner" class="catch-banner">
                Target: <?= number_format($targetMarks) ?> marks · Steer with mouse or A/D · Click or Space to drop hook
            </div>
        </div>

        <!-- ========================================================
             MODAL 1: IN-GAME PAUSE MODAL
             ======================================================== -->
        <div id="pauseModal" class="modal-overlay" style="display: none;">
            <div class="modal-card animate-modal-enter">
                <div class="top-glow-line"></div>
                
                <div class="modal-icon-circle" style="background: rgba(34, 211, 238, 0.15); border: 1px solid rgba(103, 232, 249, 0.3); color: #67e8f9;">
                    <svg viewBox="0 0 24 24" fill="currentColor" style="width: 22px; height: 22px;">
                        <rect x="6" y="4" width="4.5" height="16" rx="1.5" />
                        <rect x="13.5" y="4" width="4.5" height="16" rx="1.5" />
                    </svg>
                </div>
                
                <h2 style="font-size: 24px; font-weight: 800; color: #fff; margin-bottom: 4px;">Mission Paused</h2>
                <p style="font-size: 12px; color: #94a3b8; margin-bottom: 24px;">
                    Take a breather or adjust your rig before diving back in.
                </p>

                <div style="display: flex; flex-direction: column; gap: 12px; width: 100%;">
                    <button type="button" id="resumeMissionBtn" class="btn-ocean-primary" style="width: 100%; height: 44px; font-size: 14px;">
                        <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;">
                            <path d="M7.5 5.6a1.4 1.4 0 0 1 2.13-1.19l10.2 6.4a1.4 1.4 0 0 1 0 2.38l-10.2 6.4A1.4 1.4 0 0 1 7.5 18.4V5.6Z" />
                        </svg>
                        <span>Resume Mission</span>
                    </button>

                    <button type="button" id="restartMissionBtn" class="btn-ocean-secondary" style="width: 100%; height: 44px; font-size: 14px;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px; color: #67e8f9;">
                            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
                        </svg>
                        <span>Restart Mission</span>
                    </button>

                    <a href="gear.php" class="btn-ocean-secondary" style="width: 100%; height: 44px; font-size: 14px;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px; color: #67e8f9;">
                            <line x1="4" x2="20" y1="6" y2="6" />
                            <line x1="4" x2="20" y1="12" y2="12" />
                            <line x1="4" x2="20" y1="18" y2="18" />
                            <circle cx="9" cy="6" r="2" fill="currentColor" />
                            <circle cx="15" cy="12" r="2" fill="currentColor" />
                            <circle cx="10" cy="18" r="2" fill="currentColor" />
                        </svg>
                        <span>Hunter's Gear</span>
                    </a>

                    <button type="button" id="saveAndExitBtn" class="btn-danger" style="width: 100%; height: 44px; font-size: 14px;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" x2="9" y1="12" y2="12" />
                        </svg>
                        <span>Save &amp; Return to Hub</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- ========================================================
             MODAL 2: MARC CONRAD FISH API ORACLE PUZZLE MODAL
             ======================================================== -->
        <div id="oracleModal" class="modal-overlay" style="display: none;">
            <div class="modal-card oracle-modal-card animate-modal-enter">
                <div class="top-glow-amber"></div>

                <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 6px;">
                    <div style="padding: 8px; border-radius: 12px; background: rgba(251, 191, 36, 0.2); border: 1px solid rgba(251, 191, 36, 0.4); box-shadow: 0 0 12px rgba(251, 191, 36, 0.5);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px; color: #fbbf24;">
                            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
                        </svg>
                    </div>
                    <h2 style="font-size: 22px; font-weight: 900; color: #fff; letter-spacing: -0.02em;">
                        Golden Oracle Challenge
                    </h2>
                </div>

                <p style="font-size: 13px; color: rgba(254, 240, 138, 0.9); font-weight: 500; margin-bottom: 16px;">
                    To continue and claim <strong style="color: #fbbf24;">+1,500 bonus marks</strong>, give the correct answer!
                </p>

                <!-- Oracle Riddle Viewport -->
                <div id="oracleLoading" style="display: none; padding: 36px 0; flex-direction: column; align-items: center; gap: 12px;">
                    <div class="animate-spin" style="width: 36px; height: 36px; border: 3px solid rgba(251, 191, 36, 0.3); border-top-color: #fbbf24; border-radius: 50%;"></div>
                    <span style="font-size: 12px; color: rgba(254, 240, 138, 0.85); font-weight: 600;">
                        Summoning Oracle Riddle from Marc Conrad API...
                    </span>
                </div>

                <div id="oracleContent" style="display: flex; flex-direction: column; align-items: center; width: 100%;">
                    <div class="aquarium-frame">
                        <img id="oracleImage" src="" alt="Fish Counting Riddle">
                    </div>

                    <!-- Result Feedback Banner -->
                    <div id="oracleResultBanner" style="display: none; width: 100%; padding: 12px; border-radius: 14px; text-align: center; margin-bottom: 12px;">
                        <div id="oracleResultTitle" style="font-size: 14px; font-weight: 800; margin-bottom: 2px;"></div>
                        <div id="oracleResultMessage" style="font-size: 12px; opacity: 0.9;"></div>
                    </div>

                    <!-- Answer Submission Form -->
                    <form id="oracleForm" style="width: 100%; display: flex; flex-direction: column; align-items: center; gap: 10px;">
                        <label for="oracleAnswerInput" style="font-size: 12px; color: #67e8f9; font-weight: 600;">
                            How many fish are in the picture? (0 - 9)
                        </label>
                        <div class="oracle-input-row">
                            <input
                                id="oracleAnswerInput"
                                type="number"
                                min="0"
                                max="9"
                                step="1"
                                required
                                placeholder="Count"
                                autocomplete="off"
                            >
                            <button type="submit" id="oracleSubmitBtn" class="oracle-submit-btn">
                                Submit
                            </button>
                        </div>
                    </form>
                </div>

                <div style="margin-top: 16px; width: 100%; display: flex; justify-content: flex-end;">
                    <button type="button" id="closeOracleBtn" class="btn-ocean-secondary" style="height: 36px; padding: 0 16px; font-size: 12px; border-radius: 12px;">
                        Resume Fishing
                    </button>
                </div>
            </div>
        </div>

        <!-- ========================================================
             MODAL 3: LEVEL COMPLETE / TIME'S UP OUTCOME MODAL
             ======================================================== -->
        <div id="outcomeModal" class="modal-overlay" style="display: none;">
            <div class="modal-card animate-modal-enter">
                <div class="top-glow-line"></div>

                <!-- Personal Best Pill -->
                <div id="highScorePill" style="display: none; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 999px; background: rgba(251, 191, 36, 0.2); border: 1px solid rgba(251, 191, 36, 0.45); color: #fef08a; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;">
                        <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
                    </svg>
                    <span>New Personal Best!</span>
                </div>

                <div id="outcomeIconCircle" class="modal-icon-circle"></div>

                <h2 id="outcomeTitle" style="font-size: 26px; font-weight: 900; color: #fff; margin-bottom: 4px;"></h2>
                <p id="outcomeSubtitle" style="font-size: 12px; color: #94a3b8; margin-bottom: 20px;"></p>

                <!-- Collected Marks Card -->
                <div class="glass-subcard" style="width: 100%; padding: 16px; margin-bottom: 16px;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; font-weight: 700;">
                        Marks Collected
                    </div>
                    <div class="font-mono tabular-nums" style="font-size: 36px; font-weight: 900; color: #67e8f9; margin-top: 2px;">
                        <span id="outcomeScoreVal">0</span>
                        <span style="font-size: 16px; color: #64748b; font-weight: 600;"> / <?= number_format($targetMarks) ?></span>
                    </div>
                    <div id="outcomeShortfallMsg" style="font-size: 11px; color: #fb7185; margin-top: 4px; display: none;"></div>
                </div>

                <!-- Stats Grid: Time Left & Catches -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; margin-bottom: 20px;">
                    <div class="glass-subcard" style="padding: 10px;">
                        <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8;">Time Left</div>
                        <div id="outcomeTimeLeftVal" class="font-mono tabular-nums" style="font-size: 16px; font-weight: 800; color: #fff;">00:00</div>
                    </div>
                    <div class="glass-subcard" style="padding: 10px;">
                        <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8;">Catches</div>
                        <div id="outcomeCatchesVal" class="font-mono tabular-nums" style="font-size: 16px; font-weight: 800; color: #67e8f9;">0</div>
                    </div>
                </div>

                <!-- Outcome Action Buttons -->
                <div style="display: flex; flex-direction: column; gap: 10px; width: 100%;">
                    <!-- Consult Marc Conrad Fish Oracle Button -->
                    <button type="button" id="consultOracleBtn" style="display: none; width: 100%; height: 42px; border-radius: 12px; font-size: 12px; font-weight: 800; background: rgba(251, 191, 36, 0.2); color: #fde047; border: 1px solid rgba(251, 191, 36, 0.45); cursor: pointer; align-items: center; justify-content: center; gap: 8px;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;">
                            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
                        </svg>
                        <span>Consult Dr. Marc Conrad's Fish Oracle (+1500 Marks)</span>
                    </button>

                    <!-- Next Level or Retry Button -->
                    <button type="button" id="primaryOutcomeBtn" class="btn-ocean-primary" style="width: 100%; height: 44px; font-size: 14px;">
                        <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;">
                            <path d="M7.5 5.6a1.4 1.4 0 0 1 2.13-1.19l10.2 6.4a1.4 1.4 0 0 1 0 2.38l-10.2 6.4A1.4 1.4 0 0 1 7.5 18.4V5.6Z" />
                        </svg>
                        <span id="primaryOutcomeBtnText">Next Level</span>
                    </button>

                    <div style="display: flex; gap: 10px; width: 100%;">
                        <button type="button" id="replayLevelBtn" class="btn-ocean-secondary" style="flex: 1; height: 40px; font-size: 13px;">
                            Replay
                        </button>
                        <a href="leaderboard.php" class="btn-ocean-secondary" style="flex: 1; height: 40px; font-size: 13px;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px; color: #fbbf24;">
                                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                                <path d="M4 22h16" />
                                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                            </svg>
                            <span>Top Hunters</span>
                        </a>
                        <a href="dashboard.php" class="btn-ocean-secondary" style="flex: 1; height: 40px; font-size: 13px;">
                            Menu
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Game Engine Scripts -->
<script src="js/game.js"></script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
