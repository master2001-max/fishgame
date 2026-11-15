<?php
/**
 * Top Hunters Leaderboard View
 * File: frontend/leaderboard.php
 * 
 * Demonstrates:
 * - Theme D (Virtual Identity): Queries relational MySQL database for player rankings & high scores.
 * - Theme A (Low Coupling): All presentation styled through CSS classes (Zero inline CSS).
 * - Semantic HTML5: <article>, <header>, <section>, <table>, <thead>, <tbody>, <tr>, <th>, <td>.
 */

require_once __DIR__ . '/../backend/config/database.php';
requireAuth(); // Guard: session verification

$currentUserId = (int)$_SESSION['user_id'];
$pdo = getDBConnection();

// Fetch Top 50 highest scores from MySQL
$stmt = $pdo->prepare("
    SELECT id, user_id, name, score, difficulty, level, total_catches, games_played, updated_at
    FROM scores
    ORDER BY score DESC, total_catches DESC
    LIMIT 50
");
$stmt->execute();
$entries = $stmt->fetchAll();

// Top 3 for the podium
$topThree = array_slice($entries, 0, 3);

// Current user's rank
$yourRank = null;
$yourEntry = null;
foreach ($entries as $idx => $entry) {
    if ((int)$entry['user_id'] === $currentUserId) {
        $yourRank = $idx + 1;
        $yourEntry = $entry;
        break;
    }
}

$pageTitle = 'Top Hunters - Fish Catcher Arcade';
require_once __DIR__ . '/includes/header.php';
?>

<!-- Main Leaderboard Glass Card -->
<article class="glass-panel animate-modal-enter leaderboard-container">
    <div class="top-glow-line"></div>

    <!-- Navigation Header -->
    <header class="leaderboard-nav-row">
        <a href="dashboard.php" id="backToHubBtn" class="btn-ocean-secondary hub-btn-nav">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-md">
                <path d="m15 18-6-6 6-6" />
            </svg>
            <span>Hunter's Hub</span>
        </a>

        <div class="modal-header-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="icon-xl icon-amber">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
            <h1 class="leaderboard-title">
                Top Hunters
            </h1>
        </div>

        <div class="hide-mobile"></div>
    </header>

    <!-- Top 3 Podium Cards -->
    <?php if (!empty($topThree)): ?>
        <section class="podium-grid">
            <?php foreach ($topThree as $idx => $hunter): 
                $rank = $idx + 1;
                $isYou = ((int)$hunter['user_id'] === $currentUserId);
                $title = getHunterRankTitle((int)$hunter['score']);
            ?>
                <div class="podium-card podium-<?= $rank ?> <?= $isYou ? 'podium-card-you' : '' ?>">
                    <div class="podium-badge">
                        <?php if ($rank === 1): ?>
                            <svg viewBox="0 0 24 24" fill="currentColor" class="icon-md">
                                <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7Z" />
                            </svg>
                        <?php else: ?>
                            #<?= $rank ?>
                        <?php endif; ?>
                    </div>
                    <div class="podium-name">
                        <?= htmlspecialchars($hunter['name']) ?>
                        <?php if ($isYou): ?>
                            <span class="you-tag">YOU</span>
                        <?php endif; ?>
                    </div>
                    <div class="podium-meta">
                        <?= $title ?> · <?= htmlspecialchars($hunter['difficulty']) ?> Lv. <?= $hunter['level'] ?>
                    </div>
                    <div class="tabular-nums font-mono podium-score-<?= $rank ?>">
                        <?= number_format($hunter['score']) ?>
                    </div>
                </div>
            <?php endforeach; ?>
        </section>
    <?php endif; ?>

    <!-- Full Leaderboard Table -->
    <section class="glass-subcard leaderboard-table-card">
        <div class="table-responsive">
            <table class="ocean-table">
                <thead>
                    <tr>
                        <th class="table-col-rank">Rank</th>
                        <th class="table-col-hunter">Hunter</th>
                        <th class="table-col-stage">Stage</th>
                        <th class="table-col-catches">Catches</th>
                        <th class="table-col-score">High Score</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($entries)): ?>
                        <tr>
                            <td colspan="5" class="table-empty-cell">
                                No registered hunters yet. Start playing to establish the leaderboard!
                            </td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($entries as $idx => $hunter): 
                            $rank = $idx + 1;
                            $isYou = ((int)$hunter['user_id'] === $currentUserId);
                        ?>
                            <tr class="<?= $isYou ? 'current-user-row' : '' ?>">
                                <td class="font-mono tabular-nums table-cell-rank">
                                    #<?= $rank ?>
                                </td>
                                <td>
                                    <?= htmlspecialchars($hunter['name']) ?>
                                    <?php if ($isYou): ?>
                                        <span class="you-tag">YOU</span>
                                    <?php endif; ?>
                                </td>
                                <td class="table-cell-stage">
                                    <?= htmlspecialchars($hunter['difficulty']) ?> Lv. <?= $hunter['level'] ?>
                                </td>
                                <td class="tabular-nums table-cell-catches">
                                    <?= number_format($hunter['total_catches']) ?> (<?= $hunter['games_played'] ?> runs)
                                </td>
                                <td class="font-mono tabular-nums table-cell-score">
                                    <?= number_format($hunter['score']) ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </section>

    <!-- Personal Standing Summary Card -->
    <?php if ($yourEntry): 
        $yourTitle = getHunterRankTitle((int)$yourEntry['score']);
    ?>
        <footer class="standing-card">
            <div>
                <p class="standing-label">
                    Your Current Standing
                </p>
                <p class="standing-desc">
                    Ranked <strong>#<?= $yourRank ?></strong> as <strong><?= htmlspecialchars($yourEntry['name']) ?></strong> · <?= $yourTitle ?> · <?= htmlspecialchars($yourEntry['difficulty']) ?> Lv. <?= $yourEntry['level'] ?>
                </p>
            </div>
            <div class="standing-score-box">
                <span class="standing-score-label">
                    Personal High Score
                </span>
                <div class="tabular-nums font-mono standing-score-val">
                    <?= number_format($yourEntry['score']) ?> pts
                </div>
            </div>
        </footer>
    <?php endif; ?>
</article>

<!-- Sound Feedback on Navigation Click -->
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
