<?php
/**
 * Global Header Include
 * File: frontend/includes/header.php
 * 
 * Demonstrates:
 * - HTML5 Standard Document Structure
 * - Separation of Concerns: Zero inline CSS, styled via css/style.css
 * - Multi-Layered Oceanic Background Visuals
 */

if (!isset($pageTitle)) {
    $pageTitle = 'Fish Catcher - Deep Sea Arcade';
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($pageTitle) ?></title>
    <link rel="icon" type="image/svg+xml" href="images/favicon.svg">
    
    <!-- Google Fonts: Outfit (Headings), Plus Jakarta Sans (Body), JetBrains Mono (Numbers) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@700;800&family=Outfit:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- External Application Stylesheet (No inline CSS) -->
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <!-- Multi-Layered Oceanic Backdrop Canvas (Pure CSS) -->
    <div class="ocean-backdrop" aria-hidden="true">
        <!-- Photo texture blend overlay -->
        <div class="ocean-texture"></div>
        
        <!-- Multi-layered deep-sea gradient -->
        <div class="ocean-gradient"></div>
        
        <!-- Volumetric surface light rays -->
        <div class="light-ray ray-1 animate-ray-sway"></div>
        <div class="light-ray ray-2 animate-ray-sway ray-delay-4"></div>
        <div class="light-ray ray-3 animate-ray-sway ray-delay-2"></div>
        
        <!-- Bioluminescent ambient orbs -->
        <div class="ambient-orb orb-1 animate-float-slow"></div>
        <div class="ambient-orb orb-2 animate-float-slow orb-delay-3"></div>
        
        <!-- Subtle nautical grid texture -->
        <div class="ocean-grid"></div>
        
        <!-- Rising ambient ocean bubbles -->
        <span class="bubble bubble-1"></span>
        <span class="bubble bubble-2"></span>
        <span class="bubble bubble-3"></span>
        <span class="bubble bubble-4"></span>
        <span class="bubble bubble-5"></span>
        <span class="bubble bubble-6"></span>
        <span class="bubble bubble-7"></span>
    </div>

    <!-- Application Viewport Container -->
    <main class="app-container">
