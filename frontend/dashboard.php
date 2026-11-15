<?php
/**
 * Main Menu Dashboard View
 * File: dashboard.php
 * 
 * Demonstrates:
 * - Virtual Identity: Loads current player's profile, rank, high scores, and saved progress.
 * - Sequential Progression Track: Levels 1-6 with lock icons and completion checkmarks.
 * - Event-Driven Programming: Interactive difficulty selection and mission launch.
 */

require_once __DIR__ . '/../backend/config/database.php';
requireAuth();

$userId = (int)$_SESSION['user_id'];
$pdo = getDBConnection();

$stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id LIMIT 1");
$stmt->execute([':id' => $userId]);
$user = $stmt->fetch();

if (!$user) {
    header('Location: logout.php');
    exit;
}

$progress = json_decode($user['progress'], true) ?? getDefaultProgress();
$settings = json_decode($user['settings'], true) ?? getDefaultSettings();
$savedGame = $user['saved_game'] ? json_decode($user['saved_game'], true) : null;

$activeDifficulty = $settings['difficulty'] ?? ($user['difficulty'] ?? 'Easy');
if (!in_array($activeDifficulty, ['Easy', 'Normal', 'Hard'])) {
    $activeDifficulty = 'Easy';
}

$diffProgress = $progress[$activeDifficulty] ?? ['currentLevel' => 1, 'completed' => []];
$currentLevel = (int)$diffProgress['currentLevel'];
$completedLevels = $diffProgress['completed'] ?? [];

// Level targets per difficulty
$levelTargets = [
    'Easy'   => [350, 500, 650, 850, 1050, 1250],
    'Normal' => [800, 1100, 1400, 1700, 2000, 2300],
    'Hard'   => [1400, 1800, 2150, 2500, 2850, 3200],
];
$currentTargetMarks = $levelTargets[$activeDifficulty][$currentLevel - 1] ?? 500;
$allCleared = (count($completedLevels) >= 6);

$difficultyMeta = [
    'Easy'   => ['time' => '1.5 min', 'speed' => 'Slow',    'desc' => '1.5 min timer, slow fish speed, and low target marks.'],
    'Normal' => ['time' => '1 min',   'speed' => 'Average', 'desc' => '1 min timer, average speed, average marks, 1 jellyfish.'],
    'Hard'   => ['time' => '30s',     'speed' => 'Fast',    'desc' => '30s timer, fast speed, high marks, 2 jellyfish hazards.'],
];

$pageTitle = 'Hunter’s Hub - Fish Catcher';
require_once __DIR__ . '/includes/header.php';
?>

<div class="glass-panel animate-modal-enter" style="width: 100%; max-width: 540px; padding: 24px; position: relative;">
    <div class="top-glow-line"></div>

    <!-- Header Bar: Brand + Hunter Identity + High Score + Sign Out -->
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: 18px; border-bottom: 1px solid rgba(103, 232, 249, 0.12);">
        <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
            <svg viewBox="0 0 64 64" fill="none" style="width: 40px; height: 40px; shrink: 0; filter: drop-shadow(0 0 14px rgba(34,211,238,0.4));" aria-hidden="true">
                <defs>
                    <linearGradient id="crestRing" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stop-color="#67e8f9" />
                        <stop offset="50%" stop-color="#0ea5e9" />
                        <stop offset="100%" stop-color="#2dd4bf" />
                    </linearGradient>
                    <linearGradient id="crestFish" x1="16" y1="24" x2="48" y2="44" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stop-color="#38bdf8" />
                        <stop offset="60%" stop-color="#06b6d4" />
                        <stop offset="100%" stop-color="#5eead4" />
                    </linearGradient>
                </defs>
                <rect x="4" y="4" width="56" height="56" rx="18" fill="rgba(4, 20, 42, 0.85)" stroke="url(#crestRing)" stroke-width="2" />
                <path d="M39 11v12a4.5 4.5 0 0 1-9 0" stroke="#fde047" stroke-width="2.4" stroke-linecap="round" />
                <circle cx="39" cy="11" r="2.2" fill="#fde047" />
                <path d="M15 37c5.5-9.5 17.5-12 27.5-6l9-6.5-3 12.5 3 12.5-9-6.5c-10 6-22 3.5-27.5-6Z" fill="url(#crestFish)" />
                <circle cx="23.5" cy="35.5" r="2.3" fill="#031526" />
                <circle cx="24.2" cy="34.8" r="0.8" fill="#ffffff" />
            </svg>
            <div style="min-width: 0;">
                <h1 style="font-size: 22px; font-weight: 800; color: #fff; line-height: 1.1;">
                    Fish Catcher
                </h1>
                <div style="font-size: 12px; color: rgba(103, 232, 249, 0.9); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    <?= htmlspecialchars($user['name']) ?> · High Score: <span class="tabular-nums font-mono"><?= number_format($user['score']) ?></span>
                </div>
            </div>
        </div>

        <a href="logout.php" id="logoutBtn" class="btn-ocean-secondary" style="height: 36px; padding: 0 14px; font-size: 12px; border-radius: 12px; shrink: 0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
            <span>Sign Out</span>
        </a>
    </div>

    <!-- Difficulty Picker Grid -->
    <div style="margin-top: 20px;">
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(103, 232, 249, 0.85); margin-bottom: 8px;">
            Select Difficulty
        </div>

        <div class="difficulty-grid">
            <?php foreach (['Easy', 'Normal', 'Hard'] as $diff): 
                $meta = $difficultyMeta[$diff];
                $isSelected = ($activeDifficulty === $diff);
                $dProg = $progress[$diff] ?? ['currentLevel' => 1, 'completed' => []];
                $isDiffDone = (count($dProg['completed'] ?? []) >= 6);
            ?>
                <button
                    type="button"
                    class="diff-card <?= $isSelected ? 'active-' . $diff : '' ?>"
                    data-difficulty="<?= $diff ?>"
                >
                    <div class="diff-header">
                        <span class="diff-name"><?= $diff ?></span>
                        <span class="diff-dot"></span>
                    </div>
                    <div class="diff-sub">
                        <?= $meta['time'] ?> · <?= $meta['speed'] ?>
                    </div>
                    <div class="diff-progress-label">
                        <?= $isDiffDone ? 'All 6 Levels Cleared' : "Level {$dProg['currentLevel']} / 6" ?>
                    </div>
                </button>
            <?php endforeach; ?>
        </div>
    </div>

    <!-- Sequential Level 1 to 6 Progress Track (Theme: Sequential Level Unlock) -->
    <div class="glass-subcard" style="padding: 16px; margin-top: 14px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px;">
            <span style="font-size: 12px; font-weight: 700; color: #fff;">
                <?= $activeDifficulty ?> · Level <?= $currentLevel ?> / 6
            </span>
            <span style="font-size: 12px; font-weight: 700; color: #67e8f9;" class="tabular-nums">
                Target: <?= number_format($currentTargetMarks) ?> Marks
            </span>
        </div>

        <div class="level-track">
            <?php for ($lv = 1; $lv <= 6; $lv++): 
                $isCurrent = ($currentLevel === $lv);
                $isDone = in_array($lv, $completedLevels);
                $isLocked = (!$isDone && $lv > $currentLevel);
            ?>
                <div
                    class="level-node <?= $isCurrent ? 'is-current' : ($isDone ? 'is-done' : 'is-locked') ?>"
                    title="<?= $isDone ? "Level {$lv} Completed" : ($isCurrent ? "Current Level {$lv}" : "Level {$lv} Locked") ?>"
                >
                    <span><?= $lv ?></span>
                    <?php if ($isDone && !$isCurrent): ?>
                        <span style="font-size: 10px; line-height: 1;">✓</span>
                    <?php elseif ($isLocked): ?>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 12px; height: 12px;">
                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    <?php endif; ?>
                </div>
            <?php endfor; ?>
        </div>

        <p style="font-size: 11px; color: #94a3b8; margin-top: 8px;">
            <?= $allCleared ? "{$activeDifficulty} mode cleared! Replaying Level 6." : "Levels unlock sequentially from 1 to 6 as you complete each mission." ?>
        </p>
    </div>

    <!-- Action Buttons -->
    <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 10px;">
        <?php if ($savedGame): ?>
            <!-- Resume Saved Game Snapshot -->
            <a
                href="game.php?resume=1"
                id="resumeBtn"
                class="btn-ocean-primary"
                style="width: 100%; padding: 12px 16px; border-radius: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;"
            >
                <span style="display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 800;">
                    <svg viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px;">
                        <path d="M7.5 5.6a1.4 1.4 0 0 1 2.13-1.19l10.2 6.4a1.4 1.4 0 0 1 0 2.38l-10.2 6.4A1.4 1.4 0 0 1 7.5 18.4V5.6Z" />
                    </svg>
                    <span>Continue Where You Stopped</span>
                </span>
                <span style="font-size: 11px; font-weight: 600; opacity: 0.9;">
                    <?= htmlspecialchars($savedGame['difficulty']) ?> Lv. <?= $savedGame['level'] ?> · Score: <?= number_format($savedGame['score']) ?> · <?= sprintf('%02d:%02d', floor($savedGame['timeLeft'] / 60), $savedGame['timeLeft'] % 60) ?> left
                </span>
            </a>

            <!-- Start Fresh on Current Unlocked Level -->
            <a
                href="game.php?fresh=1"
                id="startFreshBtn"
                class="btn-ocean-secondary"
                style="width: 100%; height: 44px; font-size: 13px; font-weight: 600;"
            >
                <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px; color: #67e8f9;">
                    <path d="M7.5 5.6a1.4 1.4 0 0 1 2.13-1.19l10.2 6.4a1.4 1.4 0 0 1 0 2.38l-10.2 6.4A1.4 1.4 0 0 1 7.5 18.4V5.6Z" />
                </svg>
                <span>Start Fresh (<?= $activeDifficulty ?> Lv. <?= $currentLevel ?>)</span>
            </a>
        <?php else: ?>
            <!-- Fresh Mission Start -->
            <a
                href="game.php"
                id="startMissionBtn"
                class="btn-ocean-primary"
                style="width: 100%; height: 48px; font-size: 15px;"
            >
                <svg viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px;">
                    <path d="M7.5 5.6a1.4 1.4 0 0 1 2.13-1.19l10.2 6.4a1.4 1.4 0 0 1 0 2.38l-10.2 6.4A1.4 1.4 0 0 1 7.5 18.4V5.6Z" />
                </svg>
                <span>Start Mission (<?= $activeDifficulty ?> Lv. <?= $currentLevel ?>)</span>
            </a>
        <?php endif; ?>

        <!-- Hub Navigation Grid (Top Hunters & Hunter's Gear) -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <a href="leaderboard.php" id="leaderboardBtn" class="btn-ocean-secondary" style="height: 44px; font-size: 13px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px; color: #fde047;">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
                <span>Top Hunters</span>
            </a>

            <a href="gear.php" id="gearBtn" class="btn-ocean-secondary" style="height: 44px; font-size: 13px;">
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
        </div>
    </div>
</div>

<!-- Event-Driven Dashboard Interactions -->
<script>
document.addEventListener('DOMContentLoaded', () => {
    // Sound engine audio cues
    const addSound = (el) => {
        if (!el) return;
        el.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.playClick();
        });
    };

    addSound(document.getElementById('logoutBtn'));
    addSound(document.getElementById('resumeBtn'));
    addSound(document.getElementById('startFreshBtn'));
    addSound(document.getElementById('startMissionBtn'));
    addSound(document.getElementById('leaderboardBtn'));
    addSound(document.getElementById('gearBtn'));

    // Difficulty selection with dynamic AJAX update
    const diffButtons = document.querySelectorAll('.diff-card');
    diffButtons.forEach((btn) => {
        btn.addEventListener('click', async () => {
            if (window.soundEngine) window.soundEngine.playClick();
            const targetDiff = btn.getAttribute('data-difficulty');
            
            try {
                const response = await fetch('../backend/actions/update_settings.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ difficulty: targetDiff })
                });
                
                if (response.ok) {
                    // Reload to recompute sequential level progress for selected difficulty
                    window.location.reload();
                }
            } catch (err) {
                console.error('Failed to change difficulty:', err);
            }
        });
    });
});
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
