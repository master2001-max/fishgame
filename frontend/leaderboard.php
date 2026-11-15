<?php
/**
 * Top Hunters Leaderboard View
 * File: leaderboard.php
 * 
 * Demonstrates:
 * - High Cohesion: Queries MySQL scores table for public ranking data.
 * - Virtual Identity: Highlights the current authenticated player in the rankings.
 * - Low Coupling: Separate view presentation from database querying.
 */

require_once __DIR__ . '/../backend/config/database.php';
requireAuth();

$currentUserId = (int)$_SESSION['user_id'];
$pdo = getDBConnection();

$stmt = $pdo->prepare("
    SELECT id, user_id, name, score, difficulty, level, total_catches, games_played, updated_at
    FROM scores
    ORDER BY score DESC, total_catches DESC
    LIMIT 50
");
$stmt->execute();
$entries = $stmt->fetchAll();

$topThree = array_slice($entries, 0, 3);
$yourEntry = null;
$yourRank = 0;

foreach ($entries as $idx => $row) {
    if ((int)$row['user_id'] === $currentUserId) {
        $yourEntry = $row;
        $yourRank = $idx + 1;
        break;
    }
}

$pageTitle = 'Top Hunters - Fish Catcher Arcade';
require_once __DIR__ . '/includes/header.php';
?>

<div class="glass-panel animate-modal-enter" style="width: 100%; max-width: 820px; padding: 28px; position: relative;">
    <div class="top-glow-line"></div>

    <!-- Top Navigation Bar -->
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px;">
        <a href="dashboard.php" id="backToHubBtn" class="btn-ocean-secondary" style="height: 40px; padding: 0 16px; font-size: 13px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;">
                <path d="m15 18-6-6 6-6" />
            </svg>
            <span>Hunter's Hub</span>
        </a>

        <div style="display: flex; align-items: center; gap: 10px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width: 24px; height: 24px; color: #fbbf24;">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
            <h2 style="font-size: 24px; font-weight: 800; color: #fff; letter-spacing: -0.02em;">
                Top Hunters
            </h2>
        </div>

        <div style="width: 110px;" class="hide-mobile"></div>
    </div>

    <!-- Top 3 Podium Cards -->
    <?php if (!empty($topThree)): ?>
        <div class="podium-grid">
            <?php foreach ($topThree as $idx => $hunter): 
                $rank = $idx + 1;
                $isYou = ((int)$hunter['user_id'] === $currentUserId);
                $title = getHunterRankTitle((int)$hunter['score']);
            ?>
                <div class="podium-card podium-<?= $rank ?>" style="<?= $isYou ? 'box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.7);' : '' ?>">
                    <div class="podium-badge">
                        <?php if ($rank === 1): ?>
                            <svg viewBox="0 0 24 24" fill="currentColor" style="width: 18px; height: 18px;">
                                <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7Z" />
                            </svg>
                        <?php else: ?>
                            #<?= $rank ?>
                        <?php endif; ?>
                    </div>
                    <div style="font-size: 16px; font-weight: 800; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">
                        <?= htmlspecialchars($hunter['name']) ?>
                        <?php if ($isYou): ?>
                            <span class="you-tag">YOU</span>
                        <?php endif; ?>
                    </div>
                    <div style="font-size: 11px; color: rgba(203, 213, 225, 0.75); margin-bottom: 6px;">
                        <?= $title ?> · <?= htmlspecialchars($hunter['difficulty']) ?> Lv. <?= $hunter['level'] ?>
                    </div>
                    <div class="tabular-nums font-mono" style="font-size: 24px; font-weight: 800; color: <?= $rank === 1 ? '#fde047' : ($rank === 2 ? '#e2e8f0' : '#fdba74') ?>;">
                        <?= number_format($hunter['score']) ?>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>

    <!-- Full Leaderboard Table -->
    <div class="glass-subcard" style="overflow: hidden; margin-bottom: 20px;">
        <table class="leaderboard-table">
            <thead>
                <tr>
                    <th style="width: 12%;">Rank</th>
                    <th style="width: 38%;">Hunter</th>
                    <th style="width: 20%;">Stage</th>
                    <th style="width: 15%;">Catches</th>
                    <th style="width: 15%; text-align: right;">High Score</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($entries)): ?>
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 28px; color: #94a3b8;">
                            No registered hunters yet. Start playing to establish the leaderboard!
                        </td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($entries as $idx => $hunter): 
                        $rank = $idx + 1;
                        $isYou = ((int)$hunter['user_id'] === $currentUserId);
                    ?>
                        <tr class="<?= $isYou ? 'current-user-row' : '' ?>">
                            <td class="font-mono tabular-nums" style="font-weight: 800; color: #67e8f9;">
                                #<?= $rank ?>
                            </td>
                            <td>
                                <?= htmlspecialchars($hunter['name']) ?>
                                <?php if ($isYou): ?>
                                    <span class="you-tag">YOU</span>
                                <?php endif; ?>
                            </td>
                            <td style="font-size: 12px; color: #cbd5e1;">
                                <?= htmlspecialchars($hunter['difficulty']) ?> Lv. <?= $hunter['level'] ?>
                            </td>
                            <td style="font-size: 12px; color: #94a3b8;" class="tabular-nums">
                                <?= number_format($hunter['total_catches']) ?> (<?= $hunter['games_played'] ?> runs)
                            </td>
                            <td style="text-align: right; font-weight: 800;" class="font-mono tabular-nums">
                                <?= number_format($hunter['score']) ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>

    <!-- Personal Standing Summary Card -->
    <?php if ($yourEntry): 
        $yourTitle = getHunterRankTitle((int)$yourEntry['score']);
    ?>
        <div style="background: linear-gradient(90deg, rgba(34, 211, 238, 0.15), rgba(14, 165, 233, 0.1), rgba(45, 212, 191, 0.15)); border: 1px solid rgba(103, 232, 249, 0.3); border-radius: 18px; padding: 16px 20px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px;">
            <div>
                <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #67e8f9;">
                    Your Current Standing
                </div>
                <div style="font-size: 14px; color: #e2e8f0; margin-top: 2px;">
                    Ranked <strong style="color: #fff;">#<?= $yourRank ?></strong> as <strong style="color: #a5f3fc;"><?= htmlspecialchars($yourEntry['name']) ?></strong> · <?= $yourTitle ?> · <?= htmlspecialchars($yourEntry['difficulty']) ?> Lv. <?= $yourEntry['level'] ?>
                </div>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8;">
                    Personal High Score
                </div>
                <div class="tabular-nums font-mono" style="font-size: 22px; font-weight: 900; color: #67e8f9;">
                    <?= number_format($yourEntry['score']) ?> pts
                </div>
            </div>
        </div>
    <?php endif; ?>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    const backBtn = document.getElementById('backToHubBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.playClick();
        });
    }
});
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
