<?php
/**
 * Login Handler Action
 * File: backend/actions/login_action.php
 * 
 * Demonstrates:
 * - Virtual Identity: Verifying credentials and establishing user session.
 * - Password Security: password_verify() against bcrypt hash.
 * - Session Fixation Defense: session_regenerate_id().
 */

require_once __DIR__ . '/../config/database.php';

$isAjax = (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') ||
          (isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false);

$identifier = '';
$password = '';

if (isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $identifier = trim($input['identifier'] ?? '');
    $password   = $input['password'] ?? '';
} else {
    $identifier = trim($_POST['identifier'] ?? '');
    $password   = $_POST['password'] ?? '';
}

if (empty($identifier) || empty($password)) {
    $error = 'Please enter both your hunter name/email and password.';
    if ($isAjax) sendJsonResponse(['success' => false, 'error' => $error], 400);
    header('Location: ../../frontend/login.php?error=' . urlencode($error));
    exit;
}

try {
    $pdo = getDBConnection();

    $cleanId = strtolower($identifier);
    $stmt = $pdo->prepare("SELECT * FROM users WHERE LOWER(name) = :ident1 OR LOWER(email) = :ident2 LIMIT 1");
    $stmt->execute([':ident1' => $cleanId, ':ident2' => $cleanId]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        $error = 'Invalid username/email or password.';
        if ($isAjax) sendJsonResponse(['success' => false, 'error' => $error], 401);
        header('Location: ../../frontend/login.php?error=' . urlencode($error));
        exit;
    }

    // Regenerate session to prevent fixation
    session_regenerate_id(true);

    $_SESSION['user_id'] = (int)$user['id'];
    $_SESSION['user_name'] = $user['name'];
    $_SESSION['user_email'] = $user['email'];

    if ($isAjax) {
        sendJsonResponse([
            'success'  => true,
            'message'  => 'Sign in successful!',
            'redirect' => 'dashboard.php'
        ]);
    } else {
        header('Location: ../../frontend/dashboard.php');
        exit;
    }

} catch (Exception $e) {
    $error = 'Login error: ' . $e->getMessage();
    if ($isAjax) sendJsonResponse(['success' => false, 'error' => $error], 500);
    header('Location: ../../frontend/login.php?error=' . urlencode($error));
    exit;
}
?>