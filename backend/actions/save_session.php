<?php
/**
 * Save In-Progress Game Session Action
 * File: backend/actions/save_session.php
 * 
 * Saves a mission snapshot when paused or exiting to hub.
 */

require_once __DIR__ . '/../config/database.php';
requireApiAuth();

$userId = (int)$_SESSION['user_id'];
$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

$snapshot = [
    'difficulty' => $input['difficulty'] ?? 'Easy',
    'level'      => (int)($input['level'] ?? 1),
    'score'      => max(0, (int)($input['score'] ?? 0)),
    'catches'    => max(0, (int)($input['catches'] ?? 0)),
    'timeLeft'   => max(1, (int)($input['timeLeft'] ?? 60)),
    'savedAt'    => date('Y-m-d H:i:s'),
];

try {
    $pdo = getDBConnection();
    $stmt = $pdo->prepare("UPDATE users SET saved_game = :saved WHERE id = :id");
    $stmt->execute([
        ':saved' => json_encode($snapshot),
        ':id'    => $userId,
    ]);

    sendJsonResponse(['success' => true, 'savedGame' => $snapshot]);
} catch (Exception $e) {
    sendJsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}
?>
