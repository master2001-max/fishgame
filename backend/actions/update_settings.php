<?php
/**
 * Update Hunter Settings Action
 * File: backend/actions/update_settings.php
 * 
 * Saves audio preferences, active difficulty, and lure rig.
 */

require_once __DIR__ . '/../config/database.php';
requireApiAuth();

$userId = (int)$_SESSION['user_id'];
$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

$validDiffs = ['Easy', 'Normal', 'Hard'];
$difficulty = in_array($input['difficulty'] ?? '', $validDiffs) ? $input['difficulty'] : 'Easy';

$validLures = ['steel', 'biolum', 'solar'];
$lureStyle = in_array($input['lureStyle'] ?? '', $validLures) ? $input['lureStyle'] : 'biolum';

$music = filter_var($input['music'] ?? true, FILTER_VALIDATE_BOOLEAN);
$sfx   = filter_var($input['sfx'] ?? true, FILTER_VALIDATE_BOOLEAN);

$settings = [
    'music'      => $music,
    'sfx'        => $sfx,
    'difficulty' => $difficulty,
    'lureStyle'  => $lureStyle,
];

try {
    $pdo = getDBConnection();
    $stmt = $pdo->prepare("UPDATE users SET settings = :settings, difficulty = :difficulty WHERE id = :id");
    $stmt->execute([
        ':settings'   => json_encode($settings),
        ':difficulty' => $difficulty,
        ':id'         => $userId,
    ]);

    sendJsonResponse(['success' => true, 'settings' => $settings]);
} catch (Exception $e) {
    sendJsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}
?>
