<?php
/**
 * Clear In-Progress Game Session Action
 * File: backend/actions/clear_session.php
 */

require_once __DIR__ . '/../config/database.php';
requireApiAuth();

$userId = (int)$_SESSION['user_id'];

try {
    $pdo = getDBConnection();
    $stmt = $pdo->prepare("UPDATE users SET saved_game = NULL WHERE id = :id");
    $stmt->execute([':id' => $userId]);

    sendJsonResponse(['success' => true, 'savedGame' => null]);
} catch (Exception $e) {
    sendJsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
}
?>
