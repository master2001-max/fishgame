<?php
/**
 * Registration Handler Action
 * File: backend/actions/register_action.php
 * 
 * Demonstrates:
 * - Virtual Identity: Enrolling a new player with bcrypt-hashed credentials.
 * - Password Security: password_hash(PASSWORD_BCRYPT).
 * - SQL Injection Protection: PDO prepared statements.
 */

require_once __DIR__ . '/../config/database.php';

$isAjax = (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') ||
          (isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false);

$name     = '';
$email    = '';
$password = '';

if (isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $name     = trim($input['name'] ?? '');
    $email    = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
} else {
    $name     = trim($_POST['name'] ?? '');
    $email    = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
}

// 1. Input Validation
if (strlen($name) < 2 || strlen($name) > 32) {
    $error = 'Hunter name must be between 2 and 32 characters.';
    if ($isAjax) sendJsonResponse(['success' => false, 'error' => $error], 400);
    header('Location: ../../frontend/register.php?error=' . urlencode($error));
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $error = 'Please enter a valid email address.';
    if ($isAjax) sendJsonResponse(['success' => false, 'error' => $error], 400);
    header('Location: ../../frontend/register.php?error=' . urlencode($error));
    exit;
}

if (strlen($password) < 6) {
    $error = 'Password must be at least 6 characters.';
    if ($isAjax) sendJsonResponse(['success' => false, 'error' => $error], 400);
    header('Location: ../../frontend/register.php?error=' . urlencode($error));
    exit;
}

try {
    $pdo = getDBConnection();

    // 2. Duplicate Check
    $stmt = $pdo->prepare("SELECT id, name, email FROM users WHERE LOWER(name) = LOWER(:name) OR LOWER(email) = LOWER(:email) LIMIT 1");
    $stmt->execute([':name' => $name, ':email' => $email]);
    $existing = $stmt->fetch();

    if ($existing) {
        $error = (strtolower($existing['name']) === strtolower($name))
            ? 'That hunter name is already taken.'
            : 'That email is already registered.';
        if ($isAjax) sendJsonResponse(['success' => false, 'error' => $error], 409);
        header('Location: ../../frontend/register.php?error=' . urlencode($error));
        exit;
    }

    // 3. Hash password
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    $defaultProgress = json_encode(getDefaultProgress());
    $defaultSettings = json_encode(getDefaultSettings());

    // 4. Atomic Database Insert
    $pdo->beginTransaction();

    $insertUser = $pdo->prepare("
        INSERT INTO users (name, email, password, difficulty, level, score, total_catches, games_played, progress, settings)
        VALUES (:name, :email, :password, 'Easy', 1, 0, 0, 0, :progress, :settings)
    ");
    $insertUser->execute([
        ':name'     => $name,
        ':email'    => strtolower($email),
        ':password' => $hashedPassword,
        ':progress' => $defaultProgress,
        ':settings' => $defaultSettings,
    ]);

    $userId = (int)$pdo->lastInsertId();

    $insertScore = $pdo->prepare("
        INSERT INTO scores (user_id, name, score, difficulty, level, total_catches, games_played)
        VALUES (:user_id, :name, 0, 'Easy', 1, 0, 0)
    ");
    $insertScore->execute([
        ':user_id' => $userId,
        ':name'    => $name,
    ]);

    $pdo->commit();

    // 5. Establish Virtual Identity Session (regenerate session ID for security)
    session_regenerate_id(true);

    $_SESSION['user_id'] = $userId;
    $_SESSION['user_name'] = $name;
    $_SESSION['user_email'] = strtolower($email);

    if ($isAjax) {
        sendJsonResponse([
            'success'  => true,
            'message'  => 'Registration successful!',
            'redirect' => 'dashboard.php'
        ]);
    } else {
        header('Location: ../../frontend/dashboard.php');
        exit;
    }

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    $error = 'Registration failed: ' . $e->getMessage();
    if ($isAjax) sendJsonResponse(['success' => false, 'error' => $error], 500);
    header('Location: ../../frontend/register.php?error=' . urlencode($error));
    exit;
}
?>