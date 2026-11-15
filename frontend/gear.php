<?php
/**
 * Hunter's Gear & Preferences View
 * File: frontend/gear.php
 * 
 * Demonstrates:
 * - Theme D (Virtual Identity): Configures player audio, difficulty, and visual lure style.
 * - Theme A (Low Coupling): Presentation styled purely via external CSS classes in css/style.css (Zero inline CSS).
 * - Theme B (Event-Driven Programming): Instant DOM events persist preferences asynchronously via fetch().
 */

require_once __DIR__ . '/../backend/config/database.php';
requireAuth(); // Guard: session verification

$userId = (int)$_SESSION['user_id'];
$pdo = getDBConnection();

$stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id LIMIT 1");
$stmt->execute([':id' => $userId]);
$user = $stmt->fetch();

if (!$user) {
    header('Location: logout.php');
    exit;
}

$settings = json_decode($user['settings'], true) ?? getDefaultSettings();
$currentDiff = $settings['difficulty'] ?? ($user['difficulty'] ?? 'Easy');
$currentLure = $settings['lureStyle'] ?? 'biolum';
$musicOn = (bool)($settings['music'] ?? true);
$sfxOn   = (bool)($settings['sfx'] ?? true);

$lureStyles = [
    'steel'  => ['name' => 'Forged Steel', 'class' => 'steel'],
    'biolum' => ['name' => 'Bioluminescent', 'class' => 'biolum'],
    'solar'  => ['name' => 'Solar Gold',   'class' => 'solar'],
];

$pageTitle = 'Hunter’s Gear - Fish Catcher';
require_once __DIR__ . '/includes/header.php';
?>

<!-- Main Hunter's Gear Glass Card -->
<article class="glass-panel animate-modal-enter gear-container">
    <div class="top-glow-line"></div>

    <!-- Header Navigation -->
    <header class="gear-nav-row">
        <a href="dashboard.php" id="backToHubBtn" class="btn-ocean-secondary hub-btn-nav">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-md">
                <path d="m15 18-6-6 6-6" />
            </svg>
            <span>Hunter's Hub</span>
        </a>

        <div class="modal-header-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="icon-xl icon-cyan">
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="18" y2="18" />
                <circle cx="9" cy="6" r="2" fill="currentColor" />
                <circle cx="15" cy="12" r="2" fill="currentColor" />
                <circle cx="10" cy="18" r="2" fill="currentColor" />
            </svg>
            <h1 class="gear-title">
                Hunter's Gear
            </h1>
        </div>

        <div class="hide-mobile"></div>
    </header>

    <div class="modal-btn-stack">
        <!-- 1. Audio & Acoustics Section -->
        <section class="glass-subcard gear-section-card">
            <h2 class="gear-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-md">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
                <span>Audio &amp; Acoustics</span>
            </h2>

            <div>
                <div class="toggle-row">
                    <div>
                        <h3 class="gear-toggle-title">Ambient Ocean Soundscape</h3>
                        <p class="gear-toggle-desc">Gentle underwater resonance while navigating and hunting</p>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="musicToggle" <?= $musicOn ? 'checked' : '' ?>>
                        <span class="slider"></span>
                    </label>
                </div>

                <div class="toggle-row">
                    <div>
                        <h3 class="gear-toggle-title">Arcade Sound Effects</h3>
                        <p class="gear-toggle-desc">Line cast splashes, catch chimes, level ups, and alerts</p>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="sfxToggle" <?= $sfxOn ? 'checked' : '' ?>>
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
        </section>

        <!-- 2. Ocean Difficulty Selector -->
        <section class="glass-subcard gear-section-card">
            <h2 class="gear-section-title">
                Ocean Difficulty
            </h2>

            <div class="difficulty-grid">
                <?php
                $diffs = [
                    'Easy'   => ['label' => 'Calm Reef',     'badge' => '1.5m · Slow',    'desc' => '1.5 min timer, slow fish speed, and low target marks.'],
                    'Normal' => ['label' => 'Open Trench',   'badge' => '1m · Average',   'desc' => '1 min timer, average speed, average marks, 1 jellyfish.'],
                    'Hard'   => ['label' => 'Abyssal Surge', 'badge' => '30s · Fast',      'desc' => '30s timer, fast speed, high marks, 2 jellyfish hazards.'],
                ];
                foreach ($diffs as $dKey => $dMeta):
                    $isActive = ($currentDiff === $dKey);
                ?>
                    <button
                        type="button"
                        class="diff-select-btn diff-card diff-card-btn <?= $isActive ? 'active-' . $dKey : '' ?>"
                        data-difficulty="<?= $dKey ?>"
                    >
                        <div class="diff-card-header">
                            <span class="diff-card-title"><?= $dKey ?></span>
                            <span class="diff-card-badge">
                                <?= $dMeta['badge'] ?>
                            </span>
                        </div>
                        <div class="diff-card-label">
                            <?= $dMeta['label'] ?>
                        </div>
                        <p class="diff-card-desc">
                            <?= $dMeta['desc'] ?>
                        </p>
                    </button>
                <?php endforeach; ?>
            </div>
        </section>

        <!-- 3. Hook & Lure Rig -->
        <section class="glass-subcard gear-section-card">
            <h2 class="gear-section-title">
                Hook &amp; Lure Rig
            </h2>

            <div class="difficulty-grid">
                <?php foreach ($lureStyles as $lKey => $lMeta): 
                    $isActiveLure = ($currentLure === $lKey);
                ?>
                    <button
                        type="button"
                        class="lure-select-btn lure-card <?= $isActiveLure ? 'active' : '' ?>"
                        data-lure="<?= $lKey ?>"
                    >
                        <span class="lure-icon-frame">
                            <span class="lure-dot lure-dot-<?= $lMeta['class'] ?>"></span>
                        </span>
                        <div>
                            <div class="lure-name"><?= $lMeta['name'] ?></div>
                            <div class="lure-status">
                                <?= $isActiveLure ? 'Equipped' : 'Select rig' ?>
                            </div>
                        </div>
                    </button>
                <?php endforeach; ?>
            </div>
        </section>
    </div>
</article>

<!-- Theme B (Event-Driven Programming): Settings Persistence Script -->
<script>
document.addEventListener('DOMContentLoaded', () => {
    const musicToggle = document.getElementById('musicToggle');
    const sfxToggle = document.getElementById('sfxToggle');
    const diffButtons = document.querySelectorAll('.diff-select-btn');
    const lureButtons = document.querySelectorAll('.lure-select-btn');
    const backBtn = document.getElementById('backToHubBtn');

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.playClick();
        });
    }

    let currentSettings = {
        music: <?= $musicOn ? 'true' : 'false' ?>,
        sfx: <?= $sfxOn ? 'true' : 'false' ?>,
        difficulty: '<?= $currentDiff ?>',
        lureStyle: '<?= $currentLure ?>'
    };

    const saveSettings = async () => {
        try {
            await fetch('../backend/actions/update_settings.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentSettings)
            });
        } catch (e) {
            console.error('Settings save failed', e);
        }
    };

    musicToggle.addEventListener('change', (e) => {
        if (window.soundEngine) {
            window.soundEngine.playClick();
            window.soundEngine.setMusicEnabled(e.target.checked);
        }
        currentSettings.music = e.target.checked;
        saveSettings();
    });

    sfxToggle.addEventListener('change', (e) => {
        if (window.soundEngine) {
            window.soundEngine.playClick();
            window.soundEngine.setSfxEnabled(e.target.checked);
        }
        currentSettings.sfx = e.target.checked;
        saveSettings();
    });

    diffButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.playClick();
            diffButtons.forEach(b => {
                b.classList.remove('active-Easy', 'active-Normal', 'active-Hard');
            });
            const d = btn.getAttribute('data-difficulty');
            btn.classList.add('active-' + d);
            currentSettings.difficulty = d;
            saveSettings();
        });
    });

    lureButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.playClick();
            lureButtons.forEach(b => {
                b.classList.remove('active');
                b.querySelector('.lure-status').textContent = 'Select rig';
            });
            btn.classList.add('active');
            btn.querySelector('.lure-status').textContent = 'Equipped';
            currentSettings.lureStyle = btn.getAttribute('data-lure');
            saveSettings();
        });
    });
});
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
