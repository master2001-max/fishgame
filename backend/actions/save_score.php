<?php
/**
 * Save Mission Score Action (with Anti-Cheat Engine)
 * File: backend/actions/save_score.php
 * 
 * Demonstrates:
 * - Anti-Cheat Security: Mathematical upper bounds & physical time-duration constraints.
 * - Sequential Level Progression: Strictly validates level unlock order.
 * - Virtual Identity: User ID pulled from server-side session.
 */

require_once __DIR__ . '/../config/database.php';
requireApiAuth();

$userId = (int)$_SESSION['user_id'];

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

$difficulty = $input['difficulty'] ?? 'Easy';
$level      = (int)($input['level'] ?? 1);
$score      = (int)($input['score'] ?? 0);
$catches    = (int)($input['catches'] ?? 0);
$won        = filter_var($input['won'] ?? false, FILTER_VALIDATE_BOOLEAN);

$validDiffs = [
    'Easy'   => ['duration' => 90, 'multiplier' => 0.5, 'maxCatches' => 60],
    'Normal' => ['duration' => 60, 'multiplier' => 1.0, 'maxCatches' => 40],
    'Hard'   => ['duration' => 30, 'multiplier' => 2.0, 'maxCatches' => 20],
];

if (!array_key_exists($difficulty, $validDiffs)) {
    sendJsonResponse(['success' => false, 'error' => "Invalid difficulty: {$difficulty}"], 400);
}

$diffConf = $validDiffs[$difficulty];

// 1. Basic type and physical bounds
if ($score < 0 || $catches < 0 || $level < 1 || $level > 6) {
    sendJsonResponse(['success' => false, 'error' => 'Metrics out of valid ranges.'], 400);
}

if ($catches > $diffConf['maxCatches']) {
    sendJsonResponse([
        'success' => false,
        'error'   => "Anti-cheat: Impossible catch count ({$catches}) for {$difficulty} mode."
    ], 400);
}

// 2. Mathematical score ceiling check
$maxFishBase    = 500;
$pearlBonus     = 500;
$oracleBonus    = 800;
$theoreticalMax = ceil(($catches * $maxFishBase + $pearlBonus + $oracleBonus) * $diffConf['multiplier']);

if ($catches === 0 && $score > ($pearlBonus * $diffConf['multiplier'])) {
    sendJsonResponse(['success' => false, 'error' => 'Anti-cheat: Cannot earn points without catching fish.'], 400);
}

if ($score > $theoreticalMax) {
    sendJsonResponse([
        'success' => false,
        'error'   => "Anti-cheat: Score ({$score}) exceeds theoretical maximum ({$theoreticalMax}) for {$catches} catches."
    ], 400);
}

try {
    $pdo = getDBConnection();

    // 3. Sequential level check
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch();

    if (!$user) {
        sendJsonResponse(['success' => false, 'error' => 'Player not found.'], 404);
    }

    $progress = json_decode($user['progress'], true) ?? getDefaultProgress();
    if (!isset($progress[$difficulty])) {
        $progress[$difficulty] = ['currentLevel' => 1, 'completed' => []];
    }

    $diffProg = &$progress[$difficulty];
    $expectedLevel = (int)$diffProg['currentLevel'];

    if ($level !== $expectedLevel) {
        sendJsonResponse([
            'success' => false,
            'error'   => "Must play {$difficulty} sequentially. Current level is {$expectedLevel}."
        ], 400);
    }

    $prevBestScore = (int)$user['score'];
    $nextBestScore = max($prevBestScore, $score);
    $isNewHighScore = ($score > $prevBestScore && $score > 0);

    if ($won) {
        if (!in_array($level, $diffProg['completed'])) {
            $diffProg['completed'][] = $level;
            sort($diffProg['completed']);
        }
        if ($level < 6) {
            $diffProg['currentLevel'] = $level + 1;
        }
    }

    $nextTotalCatches = (int)$user['total_catches'] + $catches;
    $nextGamesPlayed  = (int)$user['games_played'] + 1;
    $updatedProgressJson = json_encode($progress);

    // 4. Atomic database update
    $pdo->beginTransaction();

    $updateUser = $pdo->prepare("
        UPDATE users
        SET difficulty = :difficulty,
            level = :level,
            score = :score,
            total_catches = :total_catches,
            games_played = :games_played,
            progress = :progress,
            saved_game = NULL
        WHERE id = :id
    ");
    $updateUser->execute([
        ':difficulty'    => $difficulty,
        ':level'         => $diffProg['currentLevel'],
        ':score'         => $nextBestScore,
        ':total_catches' => $nextTotalCatches,
        ':games_played'  => $nextGamesPlayed,
        ':progress'      => $updatedProgressJson,
        ':id'            => $userId
    ]);

    $updateScore = $pdo->prepare("
        INSERT INTO scores (user_id, name, score, difficulty, level, total_catches, games_played)
        VALUES (:user_id, :name, :score, :difficulty, :level, :total_catches, :games_played)
        ON DUPLICATE KEY UPDATE
            score = :score_update,
            difficulty = :diff_update,
            level = :level_update,
            total_catches = :catches_update,
            games_played = :games_update,
            updated_at = NOW()
    ");
    $updateScore->execute([
        ':user_id'        => $userId,
        ':name'           => $user['name'],
        ':score'          => $nextBestScore,
        ':difficulty'     => $difficulty,
        ':level'          => $diffProg['currentLevel'],
        ':total_catches'  => $nextTotalCatches,
        ':games_played'   => $nextGamesPlayed,
        ':score_update'   => $nextBestScore,
        ':diff_update'    => $difficulty,
        ':level_update'   => $diffProg['currentLevel'],
        ':catches_update' => $nextTotalCatches,
        ':games_update'   => $nextGamesPlayed
    ]);

    $pdo->commit();

    sendJsonResponse([
        'success'        => true,
        'isNewHighScore' => $isNewHighScore,
        'state'          => [
            'user' => [
                'id'         => $userId,
                'name'       => $user['name'],
                'email'      => $user['email'],
                'difficulty' => $difficulty,
                'level'      => $diffProg['currentLevel'],
                'score'      => $nextBestScore,
            ],
            'stats' => [
                'bestScore'    => $nextBestScore,
                'totalCatches' => $nextTotalCatches,
                'gamesPlayed'  => $nextGamesPlayed,
            ],
            'progress'   => $progress,
            'savedGame'  => null,
        ]
    ]);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendJsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
}
?>