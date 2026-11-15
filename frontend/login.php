<?php
/**
 * Hunter Sign In View
 * File: frontend/login.php
 * 
 * Demonstrates:
 * - Theme D (Virtual Identity): Secure authentication gate for registered hunters.
 * - Theme A (Low Coupling): Presentation separated into css/style.css with ZERO inline CSS.
 * - Semantic HTML5: <header>, <form>, <label>, <input>, <button>, <footer>.
 */

require_once __DIR__ . '/../backend/config/database.php';

// If hunter is already authenticated in session, forward to dashboard
if (isLoggedIn()) {
    header('Location: dashboard.php');
    exit;
}

$pageTitle = 'Sign In - Fish Catcher Arcade';
$error = $_GET['error'] ?? '';
$message = $_GET['message'] ?? '';

require_once __DIR__ . '/includes/header.php';
?>

<!-- Main Login Glass Card -->
<section class="glass-panel animate-modal-enter auth-card">
    <div class="top-glow-line"></div>

    <!-- Header & Brand Logo -->
    <header class="auth-header">
        <svg viewBox="0 0 64 64" fill="none" class="auth-logo-svg" aria-hidden="true">
            <defs>
                <linearGradient id="crestRing" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#67e8f9" />
                    <stop offset="50%" stop-color="#0ea5e9" />
                    <stop offset="100%" stop-color="#2dd4bf" />
                </linearGradient>
                <linearGradient id="crestFish" x1="16" y1="24" x2="48" y2="44" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#38bdf8" />
                    <stop offset="60%" stop-color="#06b6d4" />
                    <stop offset="100%" stop-color="#5eead4" />
                </linearGradient>
            </defs>
            <rect x="4" y="4" width="56" height="56" rx="18" fill="rgba(4, 20, 42, 0.85)" stroke="url(#crestRing)" stroke-width="2" />
            <path d="M39 11v12a4.5 4.5 0 0 1-9 0" stroke="#fde047" stroke-width="2.4" stroke-linecap="round" />
            <circle cx="39" cy="11" r="2.2" fill="#fde047" />
            <path d="M15 37c5.5-9.5 17.5-12 27.5-6l9-6.5-3 12.5 3 12.5-9-6.5c-10 6-22 3.5-27.5-6Z" fill="url(#crestFish)" />
            <circle cx="23.5" cy="35.5" r="2.3" fill="#031526" />
            <circle cx="24.2" cy="34.8" r="0.8" fill="#ffffff" />
        </svg>
        <div>
            <p class="auth-badge">Deep Sea Arcade</p>
            <h1 class="auth-title">Fish Catcher</h1>
        </div>
    </header>

    <p class="auth-subtitle">
        Sign in with your registered hunter account to play.
    </p>

    <!-- Error / Success Notification Banners -->
    <?php if (!empty($error)): ?>
        <div class="alert-error"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>

    <?php if (!empty($message)): ?>
        <div class="alert-success"><?= htmlspecialchars($message) ?></div>
    <?php endif; ?>

    <!-- Login Form (Submits to backend/actions/login_action.php) -->
    <form action="../backend/actions/login_action.php" method="POST" id="loginForm" class="auth-form">
        <!-- Username or Email Field -->
        <div class="form-group">
            <label for="login-identifier" class="form-label">Username or Email</label>
            <div class="input-wrapper">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                    id="login-identifier"
                    name="identifier"
                    type="text"
                    placeholder="Enter username or email"
                    required
                    class="glass-input"
                >
            </div>
        </div>

        <!-- Password Field with Visibility Toggle -->
        <div class="form-group">
            <label for="login-password" class="form-label">Password</label>
            <div class="input-wrapper">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                    id="login-password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                    class="glass-input"
                >
                <button
                    type="button"
                    id="togglePasswordBtn"
                    class="toggle-password-btn"
                    aria-label="Toggle password visibility"
                >
                    <svg id="eyeIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="icon-md">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                </button>
            </div>
        </div>

        <!-- Submit Button -->
        <button type="submit" id="submitBtn" class="btn-ocean-primary auth-submit-btn">
            <svg viewBox="0 0 24 24" fill="currentColor" class="icon-md">
                <path d="M7.5 5.6a1.4 1.4 0 0 1 2.13-1.19l10.2 6.4a1.4 1.4 0 0 1 0 2.38l-10.2 6.4A1.4 1.4 0 0 1 7.5 18.4V5.6Z" />
            </svg>
            <span>Dive In</span>
        </button>
    </form>

    <!-- Navigation Link to Registration -->
    <footer class="auth-footer-text">
        New to the fleet?
        <a href="register.php" class="auth-link">
            Create Hunter Profile
        </a>
    </footer>
</section>

<!-- Theme B (Event-Driven Programming): Password Toggle Event Handler -->
<script>
document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('login-password');
    const toggleBtn = document.getElementById('togglePasswordBtn');
    const eyeIcon = document.getElementById('eyeIcon');
    const form = document.getElementById('loginForm');

    // Event listener: Toggle password visibility
    toggleBtn.addEventListener('click', () => {
        if (window.soundEngine) window.soundEngine.playClick();
        const isPassword = passwordInput.getAttribute('type') === 'password';
        passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
        
        // Update SVG icon shape
        if (isPassword) {
            eyeIcon.innerHTML = '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" />';
        } else {
            eyeIcon.innerHTML = '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />';
        }
    });

    // Event listener: Form submission sound feedback
    form.addEventListener('submit', () => {
        if (window.soundEngine) window.soundEngine.playClick();
    });
});
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
