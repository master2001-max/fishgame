<?php
/**
 * Game Arena View
 * File: frontend/game.php
 * 
 * Demonstrates:
 * - HTML5 Canvas 60 FPS deep sea arcade simulation.
 * - Theme B (Event-Driven Programming): Keyboard & Mouse events for boat steering, hook casting, pause.
 * - Theme C (Interoperability): Procedural riddles from Dr. Marc Conrad's Fish API on catching the Golden Oracle fish.
 * - Theme A (Low Coupling): Presentation controlled 100% by css/style.css with ZERO inline CSS.
 */

require_once __DIR__ . '/../backend/config/database.php';
requireAuth(); // Guard: session verification

$userId = (int)$_SESSION['user_id'];
$pdo = getDBConnection();

// Fetch hunter data
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id LIMIT 1");
$stmt->execute([':id' => $userId]);
$user = $stmt->fetch();

if (!$user) {
    header('Location: logout.php');
    exit;
}

$settings = json_decode($user['settings'], true) ?? getDefaultSettings();
$progress = json_decode($user['progress'], true) ?? getDefaultProgress();
$savedGame = $user['saved_game'] ? json_decode($user['saved_game'], true) : null;

// Determine active difficulty & level
$activeDifficulty = $settings['difficulty'] ?? ($user['difficulty'] ?? 'Easy');
if (!in_array($activeDifficulty, ['Easy', 'Normal', 'Hard'])) {
    $activeDifficulty = 'Easy';
}

$diffProgress = $progress[$activeDifficulty] ?? ['currentLevel' => 1, 'completed' => []];
$level = (int)$diffProgress['currentLevel'];

// Check if user requested a fresh start or resume
$isFresh = isset($_GET['fresh']);
$isResume = isset($_GET['resume']);

$resumeSession = null;
if ($isResume && $savedGame && ($savedGame['difficulty'] ?? '') === $activeDifficulty) {
    $resumeSession = $savedGame;
    $level = (int)$savedGame['level'];
} elseif ($isFresh && $savedGame) {
    // Clear saved snapshot
    $clearStmt = $pdo->prepare("UPDATE users SET saved_game = NULL WHERE id = :id");
    $clearStmt->execute([':id' => $userId]);
}

// Level targets per difficulty
$levelTargets = [
    'Easy'   => [350, 500, 650, 850, 1050, 1250],
    'Normal' => [800, 1100, 1400, 1700, 2000, 2300],
    'Hard'   => [1400, 1800, 2150, 2500, 2850, 3200],
];
$targetMarks = $levelTargets[$activeDifficulty][$level - 1] ?? 500;

$pageTitle = "Mission Lv. {$level} ({$activeDifficulty}) - Fish Catcher";
require_once __DIR__ . '/includes/header.php';
?>

<!-- Pass configuration to game.js engine -->
<script>
window.GAME_BOOTSTRAP = {
    difficulty: <?= json_encode($activeDifficulty) ?>,
    level: <?= (int)$level ?>,
    targetMarks: <?= (int)$targetMarks ?>,
    settings: <?= json_encode($settings) ?>,
    user: {
        id: <?= (int)$user['id'] ?>,
        name: <?= json_encode($user['name']) ?>,
        score: <?= (int)$user['score'] ?>
    },
    resumeSession: <?= json_encode($resumeSession) ?>
};
</script>

<div class="game-viewport">
    <section class="glass-panel game-panel">
        <div class="top-glow-line"></div>

        <!-- Target-Based HUD Bar -->
        <header class="game-hud">
            <div class="hud-left">
                <button type="button" id="pauseBtn" class="btn-ocean-secondary hud-icon-btn">
                    <svg viewBox="0 0 24 24" fill="currentColor" class="icon-sm icon-cyan">
                        <rect x="6" y="4" width="4.5" height="16" rx="1.5" />
                        <rect x="13.5" y="4" width="4.5" height="16" rx="1.5" />
                    </svg>
                    <span>Pause</span>
                </button>

                <button type="button" id="muteBtn" class="btn-ocean-secondary hud-sound-btn" aria-label="Toggle Audio">
                    <span id="muteIconWrap"></span>
                    <span id="muteLabel" class="hud-sound-text">Audio: ON</span>
                </button>
            </div>

            <!-- Center Stage & Target Marks Progress -->
            <div class="hud-center">
                <div class="glass-subcard hud-pill">
                    <?= $activeDifficulty ?> · Lv. <?= $level ?>/6
                </div>

                <div class="glass-subcard target-progress-box">
                    <div class="target-progress-header">
                        <span class="target-label">Marks Target</span>
                        <span class="font-mono tabular-nums">
                            <span id="hudScore" class="target-score-current">0</span>
                            <span class="target-score-max"> / <?= number_format($targetMarks) ?></span>
                        </span>
                    </div>
                    <div class="progress-bar-track">
                        <div id="hudProgressBar" class="progress-bar-fill"></div>
                    </div>
                </div>
            </div>

            <!-- Countdown Timer -->
            <div id="hudTimer" class="timer-box font-mono tabular-nums">
                01:30
            </div>
        </header>

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
        <div id="pauseModal" class="modal-overlay">
            <div class="modal-card animate-modal-enter">
                <div class="top-glow-line"></div>
                
                <div class="modal-icon-circle modal-icon-pause">
                    <svg viewBox="0 0 24 24" fill="currentColor" class="icon-xl">
                        <rect x="6" y="4" width="4.5" height="16" rx="1.5" />
                        <rect x="13.5" y="4" width="4.5" height="16" rx="1.5" />
                    </svg>
                </div>
                
                <h2 class="modal-title">Mission Paused</h2>
                <p class="modal-subtitle">
                    Take a breather or adjust your rig before diving back in.
                </p>

                <div class="modal-btn-stack">
                    <button type="button" id="resumeMissionBtn" class="btn-ocean-primary hub-btn-nav">
                        <svg viewBox="0 0 24 24" fill="currentColor" class="icon-md">
                            <path d="M7.5 5.6a1.4 1.4 0 0 1 2.13-1.19l10.2 6.4a1.4 1.4 0 0 1 0 2.38l-10.2 6.4A1.4 1.4 0 0 1 7.5 18.4V5.6Z" />
                        </svg>
                        <span>Resume Mission</span>
                    </button>

                    <button type="button" id="restartMissionBtn" class="btn-ocean-secondary hub-btn-nav">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-md icon-cyan">
                            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
                        </svg>
                        <span>Restart Mission</span>
                    </button>

                    <a href="gear.php" class="btn-ocean-secondary hub-btn-nav">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="icon-md icon-cyan">
                            <line x1="4" x2="20" y1="6" y2="6" />
                            <line x1="4" x2="20" y1="12" y2="12" />
                            <line x1="4" x2="20" y1="18" y2="18" />
                            <circle cx="9" cy="6" r="2" fill="currentColor" />
                            <circle cx="15" cy="12" r="2" fill="currentColor" />
                            <circle cx="10" cy="18" r="2" fill="currentColor" />
                        </svg>
                        <span>Hunter's Gear</span>
                    </a>

                    <button type="button" id="saveAndExitBtn" class="btn-danger hub-btn-nav">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" class="icon-md">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span>Save &amp; Return to Hub</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- ========================================================
             MODAL 2: MARC CONRAD FISH API ORACLE PUZZLE MODAL
             ======================================================== -->
        <div id="oracleModal" class="modal-overlay">
            <div class="modal-card oracle-modal-card animate-modal-enter">
                <div class="top-glow-amber"></div>

                <div class="modal-header-row">
                    <div class="oracle-badge-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-lg icon-amber">
                            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
                        </svg>
                    </div>
                    <h2 class="oracle-modal-title">
                        Golden Oracle Challenge
                    </h2>
                </div>

                <p class="oracle-modal-subtitle">
                    Count the fish in the picture to claim <strong>+200 Bonus Marks</strong> from Dr. Marc Conrad's API!
                </p>

                <!-- Oracle Riddle Viewport -->
                <div id="oracleLoading" class="oracle-loading-box">
                    <div class="animate-spin oracle-spinner"></div>
                    <span class="oracle-loading-text">
                        Summoning Oracle Riddle from Marc Conrad API...
                    </span>
                </div>

                <div id="oracleContent" class="oracle-content-wrapper">
                    <div class="aquarium-frame">
                        <img id="oracleImage" src="" alt="Fish Counting Riddle">
                    </div>

                    <!-- Result Feedback Banner -->
                    <div id="oracleResultBanner" class="oracle-result-banner">
                        <div id="oracleResultTitle" class="oracle-result-title"></div>
                        <div id="oracleResultMessage" class="oracle-result-message"></div>
                    </div>

                    <!-- Answer Submission Form -->
                    <form id="oracleForm" class="oracle-form-wrapper">
                        <label for="oracleAnswerInput" class="oracle-question-label">
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

                <div class="oracle-footer-btn-row">
                    <button type="button" id="closeOracleBtn" class="btn-ocean-secondary hub-logout-btn">
                        Continue Fishing
                    </button>
                </div>
            </div>
        </div>

        <!-- ========================================================
             MODAL 3: LEVEL COMPLETE / TIME'S UP OUTCOME MODAL
             ======================================================== -->
        <div id="outcomeModal" class="modal-overlay">
            <div class="modal-card animate-modal-enter">
                <div class="top-glow-line"></div>

                <!-- Personal Best Pill -->
                <div id="highScorePill" class="high-score-pill">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-sm">
                        <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
                    </svg>
                    <span>New Personal Best!</span>
                </div>

                <div id="outcomeIconCircle" class="modal-icon-circle"></div>

                <h2 id="outcomeTitle" class="modal-title"></h2>
                <p id="outcomeSubtitle" class="modal-subtitle"></p>

                <!-- Collected Marks Card -->
                <div class="glass-subcard collected-marks-card">
                    <div class="collected-marks-label">
                        Marks Collected
                    </div>
                    <div class="font-mono tabular-nums collected-marks-val">
                        <span id="outcomeScoreVal">0</span>
                        <span class="collected-marks-target"> / <?= number_format($targetMarks) ?></span>
                    </div>
                    <div id="outcomeShortfallMsg" class="shortfall-msg"></div>
                </div>

                <!-- Stats Grid: Time Left & Catches -->
                <div class="stats-two-col">
                    <div class="glass-subcard stat-tile">
                        <div class="stat-tile-label">Time Left</div>
                        <div id="outcomeTimeLeftVal" class="font-mono tabular-nums stat-tile-val">00:00</div>
                    </div>
                    <div class="glass-subcard stat-tile">
                        <div class="stat-tile-label">Catches</div>
                        <div id="outcomeCatchesVal" class="font-mono tabular-nums stat-tile-val icon-cyan">0</div>
                    </div>
                </div>

                <!-- Outcome Action Buttons -->
                <div class="modal-btn-stack">
                    <!-- Next Level or Retry Button -->
                    <button type="button" id="primaryOutcomeBtn" class="btn-ocean-primary hub-btn-nav">
                        <svg viewBox="0 0 24 24" fill="currentColor" class="icon-md">
                            <path d="M7.5 5.6a1.4 1.4 0 0 1 2.13-1.19l10.2 6.4a1.4 1.4 0 0 1 0 2.38l-10.2 6.4A1.4 1.4 0 0 1 7.5 18.4V5.6Z" />
                        </svg>
                        <span id="primaryOutcomeBtnText">Next Level</span>
                    </button>

                    <div class="action-three-col">
                        <button type="button" id="replayLevelBtn" class="btn-ocean-secondary action-flex-btn">
                            Replay
                        </button>
                        <a href="leaderboard.php" class="btn-ocean-secondary action-flex-btn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="icon-sm icon-amber">
                                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                                <path d="M4 22h16" />
                                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                            </svg>
                            <span>Leaderboard</span>
                        </a>
                        <a href="dashboard.php" class="btn-ocean-secondary action-flex-btn">
                            Menu
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </section>
</div>

<!-- Web Audio Synthesizer Sound Engine -->
<script src="js/sound.js"></script>
<!-- Developer Fish & Balance Configuration -->
<script src="js/fish_config.js"></script>
<!-- Game Simulation Engine -->
<script src="js/game.js"></script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
