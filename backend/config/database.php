<?php
/**
 * Database Configuration & Session Security
 * File: backend/config/database.php
 * 
 * Demonstrates:
 * - Low Coupling: Database persistence isolated from UI presentation.
 * - PDO (PHP Data Objects) with Prepared Statements.
 * - Virtual Identity: PHP Session management.
 */

// Start session if not already active and headers not sent
if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
    session_start();
}

// XAMPP Default MySQL Credentials
define('DB_HOST', '127.0.0.1');
define('DB_PORT', '3306');
define('DB_NAME', 'fish_catcher');
define('DB_USER', 'root');
define('DB_PASS', '');

/**
 * Returns a singleton PDO connection.
 * @return PDO
 */
function getDBConnection() {
    static $pdo = null;

    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            die(json_encode([
                'success' => false,
                'error'   => 'Database connection failed: ' . $e->getMessage()
            ]));
        }
    }

    return $pdo;
}

/**
 * Checks if a player is currently authenticated.
 * @return bool
 */
function isLoggedIn() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

/**
 * Enforces authentication on protected frontend pages.
 */
function requireAuth() {
    if (!isLoggedIn()) {
        header('Location: login.php');
        exit;
    }
}

/**
 * Enforces authentication on JSON API endpoints.
 */
function requireApiAuth() {
    if (!isLoggedIn()) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error'   => 'Unauthorized: Please sign in to perform this action.'
        ]);
        exit;
    }
}

/**
 * Returns default level progression map.
 * @return array
 */
function getDefaultProgress() {
    return [
        'Easy'   => ['currentLevel' => 1, 'completed' => []],
        'Normal' => ['currentLevel' => 1, 'completed' => []],
        'Hard'   => ['currentLevel' => 1, 'completed' => []]
    ];
}

/**
 * Returns default game settings.
 * @return array
 */
function getDefaultSettings() {
    return [
        'music'      => true,
        'sfx'        => true,
        'difficulty' => 'Easy',
        'lureStyle'  => 'biolum'
    ];
}

/**
 * Returns hunter rank title based on score.
 * @param int $score
 * @return string
 */
function getHunterRankTitle($score) {
    if ($score >= 3000) return 'Tide Sovereign';
    if ($score >= 2200) return 'Abyss Stalker';
    if ($score >= 1400) return 'Reef Master';
    if ($score >= 600)  return 'Wave Tracker';
    return 'Deckhand';
}

/**
 * Outputs a JSON response and exits.
 * @param array $data
 * @param int $statusCode
 */
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}
?>