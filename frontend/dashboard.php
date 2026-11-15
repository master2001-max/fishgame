<?php
/**
 * Main Menu Dashboard View (Hunter's Hub)
 * File: frontend/dashboard.php
 * 
 * Demonstrates:
 * - Theme D (Virtual Identity): Pulls current player stats, rank title, and level track.
 * - Theme A (Low Coupling): All presentation driven by CSS classes in css/style.css (Zero inline styles).
 * - Theme B (Event-Driven Programming): Interactive difficulty switcher and level selection.
 * - Semantic HTML5: <article>, <header>, <section>, <nav>.
 */

require_once __DIR__ . '/../backend/config/database.php';
requireAuth(); // Guard: redirects guests to login.php

$userId = (int)$_SESSION['user_id'];
$pdo = getDBConnection();

// Load current user profile from MySQL
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id LIMIT 1");
$stmt->execute([':id' => $userId]);
$user = $stmt->fetch();

if (!$user) {
    header('Location: logout.php');
    exit;
}

// Decode JSON progression and settings
$progress = json_decode($user['progress'], true) ?? getDefaultProgress();
$settings = json_decode($user['settings'], true) ?? getDefaultSettings();
$savedGame = $user['saved_game'] ? json_decode($user['saved_game'], true) : null;

// Determine active difficulty
$activeDifficulty = $settings['difficulty'] ?? ($user['difficulty'] ?? 'Easy');
if (!in_array($activeDifficulty, ['Easy', 'Normal', 'Hard'])) {
    $activeDifficulty = 'Easy';
}

$diffProgress = $progress[$activeDifficulty] ?? ['currentLevel' => 1, 'completed' => []];
$currentLevel = (int)$diffProgress['currentLevel'];
$completedLevels = $diffProgress['completed'] ?? [];

// Target scores per difficulty and level (1-6)
$levelTargets = [
    'Easy'   => [350, 500, 650, 850, 1050, 1250],
    'Normal' => [800, 1100, 1400, 1700, 2000, 2300],
    'Hard'   => [1400, 1800, 2150, 2500, 2850, 3200],
];
$currentTargetMarks = $levelTargets[$activeDifficulty][$currentLevel - 1] ?? 500;
$allCleared = (count($completedLevels) >= 6);

// Difficulty metadata
$difficultyMeta = [
    'Easy'   => ['time' => '1.5 min', 'speed' => 'Slow',    'desc' => '1.5 min timer, slow fish speed, and low target marks.'],
    'Normal' => ['time' => '1 min',   'speed' => 'Average', 'desc' => '1 min timer, average speed, average marks, 1 jellyfish.'],
    'Hard'   => ['time' => '30s',     'speed' => 'Fast',    'desc' => '30s timer, fast speed, high marks, 2 jellyfish hazards.'],
];

$pageTitle = 'Hunter’s Hub - Fish Catcher';
require_once __DIR__ . '/includes/header.php';
?>

<!-- Main Hunter Hub Glass Card -->
<article class="glass-panel animate-modal-enter hub-card">
    <div class="top-glow-line"></div>

    <!-- Hunter Profile & Sign-out Header -->
    <header class="hub-header">
        <div class="hub-user-wrapper">
            <svg viewBox="0 0 64 64" fill="none" class="hub-crest-svg" aria-hidden="true">
                <defs>
                    <linearGradient id="hubRing" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stop-color="#67e8f9" />
                        <stop offset="50%" stop-color="#0ea5e9" />
                        <stop offset="100%" stop-color="#2dd4bf" />
                    </linearGradient>
                    <linearGradient id="hubFish" x1="16" y1="24" x2="48" y2="44" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stop-color="#38bdf8" />
                        <stop offset="60%" stop-color="#06b6d4" />
                        <stop offset="100%" stop-color="#5eead4" />
                    </linearGradient>
                </defs>
                <rect x="4" y="4" width="56" height="56" rx="16" fill="rgba(4, 20, 42, 0.85)" stroke="url(#hubRing)" stroke-width="2" />
                <path d="M15 37c5.5-9.5 17.5-12 27.5-6l9-6.5-3 12.5 3 12.5-9-6.5c-10 6-22 3.5-27.5-6Z" fill="url(#hubFish)" />
                <circle cx="23.5" cy="35.5" r="2.3" fill="#031526" />
                <circle cx="24.2" cy="34.8" r="0.8" fill="#ffffff" />
            </svg>
            <div class="hub-user-meta">
                <h1 class="hub-username">
                    <?= htmlspecialchars($user['name']) ?>
                </h1>
                <p class="hub-user-stats">
                    <?= getHunterRankTitle((int)$user['score']) ?> · <?= number_format((int)$user['score']) ?> pts · <?= (int)$user['total_catches'] ?> Catches
                </p>
            </div>
        </div>

        <a href="logout.php" id="logoutBtn" class="btn-ocean-secondary hub-logout-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" class="icon-sm">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sign Out</span>
        </a>
    </header>

    <!-- Difficulty Current Selection Section -->
    <section class="hub-section">
        <h2 class="hub-section-title">Difficulty Current</h2>
        <div class="difficulty-grid">
            <?php foreach (['Easy', 'Normal', 'Hard'] as $diff): ?>
                <?php
                    $isSelected = ($activeDifficulty === $diff);
                    $meta = $difficultyMeta[$diff];
                ?>
                <button
                    type="button"
                    class="difficulty-card <?= $isSelected ? 'selected' : '' ?>"
                    data-difficulty="<?= $diff ?>"
                >
                    <div class="diff-header">
                        <span class="diff-name"><?= $diff ?></span>
                        <span class="diff-time"><?= $meta['time'] ?></span>
                    </div>
                    <div class="diff-badge">Speed: <?= $meta['speed'] ?></div>
                    <p class="diff-desc"><?= $meta['desc'] ?></p>
                </button>
            <?php endforeach; ?>
        </div>
    </section>

    <!-- Sequential Level Progress Track (Levels 1 - 6) -->
    <section class="glass-subcard hub-progress-card">
        <div class="hub-progress-header">
            <span class="hub-progress-title">
                <?= $activeDifficulty ?> Mission Progression
            </span>
            <span class="hub-progress-target tabular-nums">
                Level Target: <?= number_format($currentTargetMarks) ?> marks
            </span>
        </div>

        <div class="level-track">
            <?php for ($lvl = 1; $lvl <= 6; $lvl++): ?>
                <?php
                    $isCompleted = in_array($lvl, $completedLevels);
                    $isCurrent = ($lvl === $currentLevel);
                    $isLocked = ($lvl > $currentLevel && !$isCompleted);

                    $stepClass = 'locked';
                    if ($isCompleted) $stepClass = 'completed';
                    elseif ($isCurrent) $stepClass = 'current';
                ?>
                <div class="level-step <?= $stepClass ?>" title="Level <?= $lvl ?>">
                    <?php if ($isCompleted): ?>
                        <span>✓</span>
                    <?php elseif ($isLocked): ?>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-sm">
                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    <?php else: ?>
                        <span><?= $lvl ?></span>
                    <?php endif; ?>
                </div>
            <?php endfor; ?>
        </div>

        <p class="hub-progress-desc">
            <?php if ($allCleared): ?>
                ⭐ Master Rank Achieved! All 6 levels cleared on <?= $activeDifficulty ?> current!
            <?php else: ?>
                Navigate sequential levels 1 to 6. Catch fish and summon the Golden Oracle to advance.
            <?php endif; ?>
        </p>
    </section>

    <!-- Mission Launch and Navigation Actions -->
    <nav class="hub-actions">
        <?php if ($savedGame && ($savedGame['difficulty'] ?? '') === $activeDifficulty): ?>
            <!-- Resume Paused Mission -->
            <a href="game.php?resume=1" id="resumeMissionBtn" class="btn-ocean-primary hub-btn-resume">
                <span class="btn-text-row">
                    <svg viewBox="0 0 24 24" fill="currentColor" class="icon-lg">
                        <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <span>Resume Mission (Level <?= (int)$savedGame['level'] ?>)</span>
                </span>
                <span class="btn-subtext">
                    <?= number_format((int)$savedGame['score']) ?> marks · <?= (int)$savedGame['timeLeft'] ?>s remaining
                </span>
            </a>

            <!-- Start Fresh Mission -->
            <a href="game.php?fresh=1" id="startFreshBtn" class="btn-ocean-secondary hub-btn-restart">
                <svg viewBox="0 0 24 24" fill="currentColor" class="icon-md icon-cyan">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                <span>Discard Saved & Restart Level <?= $currentLevel ?></span>
            </a>
        <?php else: ?>
            <!-- Normal Mission Start -->
            <a href="game.php" id="startMissionBtn" class="btn-ocean-primary hub-btn-start">
                <svg viewBox="0 0 24 24" fill="currentColor" class="icon-lg">
                    <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>Launch Mission · Level <?= $currentLevel ?> (<?= $activeDifficulty ?>)</span>
            </a>
        <?php endif; ?>

        <!-- Secondary Navigation (Leaderboard & Gear) -->
        <div class="hub-secondary-grid">
            <a href="leaderboard.php" id="leaderboardBtn" class="btn-ocean-secondary hub-btn-nav">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="icon-md icon-amber">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
                <span>Top Hunters</span>
            </a>

            <a href="gear.php" id="gearBtn" class="btn-ocean-secondary hub-btn-nav">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="icon-md icon-cyan">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
                <span>Hunter's Gear</span>
            </a>
        </div>
    </nav>
</article>

<!-- Theme B (Event-Driven Programming): Difficulty Switcher Script -->
<script>
document.addEventListener('DOMContentLoaded', () => {
    const diffButtons = document.querySelectorAll('.difficulty-card');

    diffButtons.forEach((btn) => {
        btn.addEventListener('click', async () => {
            if (window.soundEngine) window.soundEngine.playClick();
            const targetDiff = btn.getAttribute('data-difficulty');
            
            // Highlight selected button
            diffButtons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');

            // Persist setting to backend via asynchronous fetch
            try {
                const response = await fetch('../backend/actions/update_settings.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ difficulty: targetDiff })
                });
                const data = await response.json();
                if (data.success) {
                    // Reload to update sequential level track for the chosen difficulty
                    window.location.reload();
                }
            } catch (err) {
                console.error('Failed to update difficulty:', err);
            }
        });
    });
});
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
