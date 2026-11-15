<?php
/**
 * Frontend Index Router
 * File: frontend/index.php
 * 
 * Directs authenticated hunters to the Dashboard (Main Menu)
 * and guest visitors to the Login page.
 */

require_once __DIR__ . '/../backend/config/database.php';

if (isLoggedIn()) {
    header('Location: dashboard.php');
} else {
    header('Location: login.php');
}
exit;
?>
