<?php
/**
 * Logout Handler
 * File: logout.php
 * 
 * Part of Virtual Identity theme: safely terminates the player session.
 */

require_once __DIR__ . '/../backend/config/database.php';

// Unset all session variables
$_SESSION = [];

// Delete session cookie if present
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
    );
}

// Destroy session data on server
session_destroy();

header('Location: login.php');
exit;
?>