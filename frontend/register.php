<?php
/**
 * Hunter Registration View
 * File: frontend/register.php
 * 
 * Part of Virtual Identity theme: enlists new hunters into the system.
 */

require_once __DIR__ . '/../backend/config/database.php';

// If already logged in, redirect to dashboard
if (isLoggedIn()) {
    header('Location: dashboard.php');
    exit;
}

$pageTitle = 'Enlist as Hunter - Fish Catcher Arcade';
$error = $_GET['error'] ?? '';

require_once __DIR__ . '/includes/header.php';
?>

<div class="glass-panel animate-modal-enter" style="width: 100%; max-width: 460px; padding: 36px 32px; display: flex; flex-direction: column; align-items: center;">
    <div class="top-glow-line"></div>

    <!-- Brand Crest & Header -->
    <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 8px;">
        <svg viewBox="0 0 64 64" fill="none" style="width: 48px; height: 48px; filter: drop-shadow(0 0 16px rgba(34,211,238,0.45));" aria-hidden="true">
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
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.24em; color: rgba(103, 232, 249, 0.8);">
                Enlist Today
            </div>
            <h1 style="font-size: 32px; font-weight: 800; color: #fff; line-height: 1.1;">
                Become a Hunter
            </h1>
        </div>
    </div>

    <p style="font-size: 14px; color: rgba(203, 213, 225, 0.85); margin-bottom: 24px; text-align: center;">
        Register your account to save level progress and compete for high scores.
    </p>

    <!-- Error Alert -->
    <?php if (!empty($error)): ?>
        <div class="alert-error"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>

    <!-- Register Form -->
    <form action="../backend/actions/register_action.php" method="POST" id="registerForm" style="width: 100%; display: flex; flex-direction: column; gap: 16px;">
        <div class="form-group">
            <label for="register-username" class="form-label">Hunter Name</label>
            <div class="input-wrapper">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                    id="register-username"
                    name="name"
                    type="text"
                    placeholder="Choose a hunter name"
                    required
                    minlength="2"
                    maxlength="32"
                    class="glass-input"
                >
            </div>
        </div>

        <div class="form-group">
            <label for="register-email" class="form-label">Email Address</label>
            <div class="input-wrapper">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <input
                    id="register-email"
                    name="email"
                    type="email"
                    placeholder="hunter@example.com"
                    required
                    class="glass-input"
                >
            </div>
        </div>

        <div class="form-group">
            <label for="register-password" class="form-label">Password</label>
            <div class="input-wrapper">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                    id="register-password"
                    name="password"
                    type="password"
                    placeholder="Minimum 6 characters"
                    required
                    minlength="6"
                    class="glass-input"
                >
                <button
                    type="button"
                    id="togglePasswordBtn"
                    class="toggle-password-btn"
                    aria-label="Toggle password visibility"
                >
                    <svg id="eyeIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                </button>
            </div>
        </div>

        <button type="submit" id="submitBtn" class="btn-ocean-primary" style="width: 100%; height: 48px; margin-top: 8px; font-size: 15px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;">
                <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
            </svg>
            <span>Join the Hunt</span>
        </button>
    </form>

    <p style="margin-top: 24px; font-size: 13px; color: rgba(203, 213, 225, 0.8);">
        Already registered?
        <a href="login.php" style="color: #67e8f9; font-weight: 700; text-decoration: underline; text-underline-offset: 4px;">
            Sign In
        </a>
    </p>
</div>

<!-- Event-Driven Password Toggle Script -->
<script>
document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('register-password');
    const toggleBtn = document.getElementById('togglePasswordBtn');
    const eyeIcon = document.getElementById('eyeIcon');
    const form = document.getElementById('registerForm');

    toggleBtn.addEventListener('click', () => {
        if (window.soundEngine) window.soundEngine.playClick();
        const isPassword = passwordInput.getAttribute('type') === 'password';
        passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
        
        if (isPassword) {
            eyeIcon.innerHTML = '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" />';
        } else {
            eyeIcon.innerHTML = '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />';
        }
    });

    form.addEventListener('submit', () => {
        if (window.soundEngine) window.soundEngine.playClick();
    });
});
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
