<?php
/**
 * Leaderboard JSON API Endpoint
 * File: backend/api/leaderboard_api.php
 * 
 * Fetches the top ranked hunters from the MySQL scores table.
 */

require_once __DIR__ . '/../config/database.php';
requireApiAuth();

$currentUserId = (int)$_SESSION['user_id'];

try {
    $pdo = getDBConnection();
    $stmt = $pdo->prepare("
        SELECT id, user_id, name, score, difficulty, level, total_catches, games_played, updated_at
        FROM scores
        ORDER BY score DESC, total_catches DESC
        LIMIT 50
    ");
    $stmt->execute();
    $rows = $stmt->fetchAll();

    $entries = [];
    foreach ($rows as $idx => $row) {
        $score = (int)$row['score'];
        $entries[] = [
            'rank'          => $idx + 1,
            'id'            => (int)$row['user_id'],
            'name'          => $row['name'],
            'score'         => $score,
            'difficulty'    => $row['difficulty'],
            'level'         => (int)$row['level'],
            'totalCatches'  => (int)$row['total_catches'],
            'gamesPlayed'   => (int)$row['games_played'],
            'title'         => getHunterRankTitle($score),
            'isCurrentUser' => ((int)$row['user_id'] === $currentUserId),
        ];
    }

    sendJsonResponse(['success' => true, 'entries' => $entries]);
} catch (Exception $e) {
    sendJsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}
?>
