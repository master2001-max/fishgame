<?php
/**
 * Global Header Include
 * File: frontend/includes/header.php
 * 
 * Sets up HTML document metadata, custom fonts, CSS stylesheets,
 * and the animated deep sea ocean backdrop.
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
    
    <!-- Application Main Stylesheet -->
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <!-- Multi-Layered Oceanic Backdrop -->
    <div class="ocean-backdrop" aria-hidden="true">
        <!-- Photo texture blend overlay -->
        <div class="ocean-texture"></div>
        
        <!-- Multi-layered deep-sea gradient -->
        <div class="ocean-gradient"></div>
        
        <!-- Volumetric surface light rays -->
        <div class="light-ray ray-1 animate-ray-sway"></div>
        <div class="light-ray ray-2 animate-ray-sway" style="animation-delay: -4s;"></div>
        <div class="light-ray ray-3 animate-ray-sway" style="animation-delay: -2s;"></div>
        
        <!-- Bioluminescent ambient orbs -->
        <div class="ambient-orb orb-1 animate-float-slow"></div>
        <div class="ambient-orb orb-2 animate-float-slow" style="animation-delay: -3s;"></div>
        
        <!-- Subtle nautical grid texture -->
        <div class="ocean-grid"></div>
        
        <!-- Rising ambient bubbles -->
        <span class="bubble" style="left: 8%; width: 6px; height: 6px; animation-duration: 14s; animation-delay: 0s;"></span>
        <span class="bubble" style="left: 19%; width: 10px; height: 10px; animation-duration: 19s; animation-delay: 3s;"></span>
        <span class="bubble" style="left: 33%; width: 5px; height: 5px; animation-duration: 12s; animation-delay: 6s;"></span>
        <span class="bubble" style="left: 48%; width: 8px; height: 8px; animation-duration: 16s; animation-delay: 1.5s;"></span>
        <span class="bubble" style="left: 64%; width: 11px; height: 11px; animation-duration: 21s; animation-delay: 4s;"></span>
        <span class="bubble" style="left: 77%; width: 6px; height: 6px; animation-duration: 15s; animation-delay: 2s;"></span>
        <span class="bubble" style="left: 90%; width: 9px; height: 9px; animation-duration: 17s; animation-delay: 5s;"></span>
    </div>

    <!-- Application Viewport Container -->
    <main class="app-container">
