<?php
/**
 * Hunter's Gear & Settings View
 * File: gear.php
 * 
 * Demonstrates:
 * - Event-Driven Programming: Interactive toggle switches and lure selection.
 * - Virtual Identity: Persisting hunter equipment and audio preferences into MySQL.
 */

require_once __DIR__ . '/../backend/config/database.php';
requireAuth();

$userId = (int)$_SESSION['user_id'];
$pdo = getDBConnection();

$stmt = $pdo->prepare("SELECT settings, difficulty FROM users WHERE id = :id LIMIT 1");
$stmt->execute([':id' => $userId]);
$user = $stmt->fetch();

$settings = json_decode($user['settings'] ?? '{}', true) ?? getDefaultSettings();
$currentDiff = $settings['difficulty'] ?? ($user['difficulty'] ?? 'Easy');
$currentLure = $settings['lureStyle'] ?? 'biolum';
$musicOn = !empty($settings['music']);
$sfxOn = !empty($settings['sfx']);

$lureStyles = [
    'steel'  => ['name' => 'Classic Steel', 'hex' => '#cbd5e1', 'glow' => 'rgba(148, 163, 184, 0.45)'],
    'biolum' => ['name' => 'Biolume Cyan',  'hex' => '#22d3ee', 'glow' => 'rgba(34, 211, 238, 0.85)'],
    'solar'  => ['name' => 'Solar Gold',   'hex' => '#fbbf24', 'glow' => 'rgba(251, 191, 36, 0.85)'],
];

$pageTitle = 'Hunter’s Gear - Fish Catcher';
require_once __DIR__ . '/includes/header.php';
?>

<div class="glass-panel animate-modal-enter" style="width: 100%; max-width: 760px; padding: 28px; position: relative;">
    <div class="top-glow-line"></div>

    <!-- Header Navigation -->
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px;">
        <a href="dashboard.php" id="backToHubBtn" class="btn-ocean-secondary" style="height: 40px; padding: 0 16px; font-size: 13px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;">
                <path d="m15 18-6-6 6-6" />
            </svg>
            <span>Hunter's Hub</span>
        </a>

        <div style="display: flex; align-items: center; gap: 10px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width: 22px; height: 22px; color: #67e8f9;">
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="18" y2="18" />
                <circle cx="9" cy="6" r="2" fill="currentColor" />
                <circle cx="15" cy="12" r="2" fill="currentColor" />
                <circle cx="10" cy="18" r="2" fill="currentColor" />
            </svg>
            <h2 style="font-size: 24px; font-weight: 800; color: #fff; letter-spacing: -0.02em;">
                Hunter's Gear
            </h2>
        </div>

        <div style="width: 110px;" class="hide-mobile"></div>
    </div>

    <div style="display: flex; flex-direction: column; gap: 20px;">
        <!-- 1. Audio & Acoustics Section -->
        <div class="glass-subcard" style="padding: 20px;">
            <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #67e8f9; margin-bottom: 12px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
                <span>Audio &amp; Acoustics</span>
            </div>

            <div>
                <div class="toggle-row">
                    <div>
                        <div style="font-size: 14px; font-weight: 700; color: #fff;">Ambient Ocean Soundscape</div>
                        <div style="font-size: 12px; color: #94a3b8;">Gentle underwater resonance while navigating and hunting</div>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="musicToggle" <?= $musicOn ? 'checked' : '' ?>>
                        <span class="slider"></span>
                    </label>
                </div>

                <div class="toggle-row">
                    <div>
                        <div style="font-size: 14px; font-weight: 700; color: #fff;">Arcade Sound Effects</div>
                        <div style="font-size: 12px; color: #94a3b8;">Line cast splashes, catch chimes, level ups, and alerts</div>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="sfxToggle" <?= $sfxOn ? 'checked' : '' ?>>
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
        </div>

        <!-- 2. Ocean Difficulty Selector -->
        <div class="glass-subcard" style="padding: 20px;">
            <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #67e8f9; margin-bottom: 12px;">
                Ocean Difficulty
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
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
                        class="diff-select-btn diff-card <?= $isActive ? 'active-' . $dKey : '' ?>"
                        data-difficulty="<?= $dKey ?>"
                        style="border-radius: 16px; padding: 16px; text-align: left;"
                    >
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                            <span style="font-weight: 800; color: #fff; font-size: 14px;"><?= $dKey ?></span>
                            <span style="font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 999px; background: rgba(255,255,255,0.1); color: #67e8f9;">
                                <?= $dMeta['badge'] ?>
                            </span>
                        </div>
                        <div style="font-size: 12px; font-weight: 600; color: rgba(103, 232, 249, 0.9); margin-bottom: 4px;">
                            <?= $dMeta['label'] ?>
                        </div>
                        <p style="font-size: 11px; color: #94a3b8; line-height: 1.4;">
                            <?= $dMeta['desc'] ?>
                        </p>
                    </button>
                <?php endforeach; ?>
            </div>
        </div>

        <!-- 3. Hook & Lure Rig -->
        <div class="glass-subcard" style="padding: 20px;">
            <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #67e8f9; margin-bottom: 12px;">
                Hook &amp; Lure Rig
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                <?php foreach ($lureStyles as $lKey => $lMeta): 
                    $isActiveLure = ($currentLure === $lKey);
                ?>
                    <button
                        type="button"
                        class="lure-select-btn"
                        data-lure="<?= $lKey ?>"
                        style="padding: 14px; border-radius: 16px; border: 1px solid <?= $isActiveLure ? 'rgba(34, 211, 238, 0.7)' : 'rgba(255, 255, 255, 0.1)' ?>; background: <?= $isActiveLure ? 'rgba(34, 211, 238, 0.18)' : 'rgba(3, 15, 32, 0.4)' ?>; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: all 0.2s ease;"
                    >
                        <span style="width: 32px; height: 32px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2); background: rgba(2, 11, 24, 0.8); box-shadow: 0 0 14px <?= $lMeta['glow'] ?>; display: flex; align-items: center; justify-content: center; shrink: 0;">
                            <span style="width: 14px; height: 14px; border-radius: 50%; background: <?= $lMeta['hex'] ?>;"></span>
                        </span>
                        <div style="text-align: left;">
                            <div style="font-size: 14px; font-weight: 700; color: #fff;"><?= $lMeta['name'] ?></div>
                            <div class="lure-status" style="font-size: 11px; color: #94a3b8;">
                                <?= $isActiveLure ? 'Equipped' : 'Select rig' ?>
                            </div>
                        </div>
                    </button>
                <?php endforeach; ?>
            </div>
        </div>
    </div>
</div>

<!-- Event-Driven Settings Persistence Script -->
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
                b.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                b.style.background = 'rgba(3, 15, 32, 0.4)';
                b.querySelector('.lure-status').textContent = 'Select rig';
            });
            btn.style.borderColor = 'rgba(34, 211, 238, 0.7)';
            btn.style.background = 'rgba(34, 211, 238, 0.18)';
            btn.querySelector('.lure-status').textContent = 'Equipped';
            currentSettings.lureStyle = btn.getAttribute('data-lure');
            saveSettings();
        });
    });
});
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
