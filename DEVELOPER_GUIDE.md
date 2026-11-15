# Fish Catcher – Developer & Viva Reference Guide
**University Assignment:** CIS045-3 Distributed Service Architectures  
**Technology Stack:** HTML5, CSS3, Vanilla JavaScript, PHP 8.2 (PDO), MySQL, Apache (XAMPP)  
**External Interoperability:** Dr. Marc Conrad's Fish API (`https://www.marcconrad.com/uob/fish`)

---

## 1. Architecture Overview & High Cohesion / Low Coupling

The application adheres strictly to the **Low Coupling & High Cohesion** software engineering principle:

```
fishCatcher/
├── frontend/
│   ├── js/
│   │   ├── fish_config.js      <-- [HIGH COHESION] Central Developer Gameplay Configuration
│   │   ├── sound.js            <-- [HIGH COHESION] Procedural Web Audio Synth & Energetic BGM
│   │   └── game.js             <-- [HIGH COHESION] 60 FPS HTML5 Canvas Physics Simulation
│   ├── css/
│   │   └── style.css           <-- Pure CSS styling (ZERO inline styles)
│   ├── dashboard.php           <-- Hunter Headquarters & Difficulty Selection
│   ├── game.php                <-- Mission Ocean Arena
│   ├── gear.php                <-- Visual Equipment Customizer
│   ├── leaderboard.php         <-- Top Hunters Rankings
│   ├── index.php / login.php   <-- Virtual Identity & Session Entry
│   └── includes/               <-- Reusable Header & Footer Partials
│
└── backend/
    ├── config/database.php     <-- PDO MySQL Database Connection Singleton
    ├── api/fish.php            <-- Interoperability Proxy to Dr. Marc Conrad's API
    └── actions/                <-- Isolated Controller Endpoints (login, register, save_score, etc.)
```

Because **gameplay configuration** is completely decoupled from the **canvas rendering engine**, developers do **not** need to touch the 1,400+ lines in `game.js` to add fish, alter marks, or rebalance difficulty.

---

## 2. Where Game Data Lives: `frontend/js/fish_config.js`

All fish definitions, point values, swimming speeds, and difficulty targets live in one centralized, clean file:
👉 **`frontend/js/fish_config.js`**

### Structure of a Fish Species Object
```javascript
{
    id: 'clownfish',              // Unique string identifier
    name: 'Striped Clownfish',    // Display name shown to hunter
    points: 40,                   // Marks awarded when caught
    rarity: 'Common',             // 'Common' | 'Uncommon' | 'Rare' | 'Mythic' | 'Legendary'
    isSpecial: false,             // Set true to summon Dr. Marc Conrad's API Riddle!
    speedBase: 1.15,              // Base swimming speed multiplier
    sizeX: 13,                    // Width / hitbox scale (in pixels)
    sizeY: 6.5,                   // Height / vertical hitbox scale
    color: '#fb923c',             // Main body color (Hex or CSS color)
    accentColor: '#fdba74',       // Fin / stripe accent color
    bellyColor: '#ffffff',        // Belly highlight color
    glow: null,                   // Optional glow aura (e.g. 'rgba(45, 212, 191, 0.85)')
    minDepth: 75,                 // Highest depth it can swim (px from water surface)
    maxDepth: 190,                // Deepest depth it can swim (px from water surface)
}
```

---

## 3. How-To Developer Tutorials

### Tutorial A: How to Change Marks (Points) for an Existing Fish
1. Open `frontend/js/fish_config.js`.
2. Locate the fish by its `id` (e.g., `'clownfish'`, `'barb'`, or `'biolume'`).
3. Modify the `points` field:
   ```javascript
   // Change from 40 to 60 marks:
   points: 60,
   ```
4. Save the file. Refresh `game.php` in your browser. Catches will now immediately award 60 marks!

---

### Tutorial B: How to Add a Brand New Fish Species
To add a new fish to the ocean, simply append a new object to the `FISH_SPECIES` array in `frontend/js/fish_config.js`.

**Example: Adding a "Prismatic Sunfish"**
```javascript
// Paste this inside FISH_SPECIES in frontend/js/fish_config.js:
{
    id: 'sunfish',
    name: 'Prismatic Sunfish',
    points: 275,
    rarity: 'Mythic',
    isSpecial: false,
    speedBase: 2.4,
    sizeX: 22,
    sizeY: 14,
    color: '#f43f5e',
    accentColor: '#fbbf24',
    bellyColor: '#fef08a',
    glow: 'rgba(244, 63, 94, 0.75)',
    minDepth: 180,
    maxDepth: 380,
},
```
**What happens automatically:**
- The procedural spawning algorithm in `pickNextSpecies(level)` immediately includes your new fish in the active pool.
- The 60 FPS HTML5 canvas engine renders its scales, swimming movement, fin flutter, and glow aura according to your colors and dimensions.
- The hook collision detector detects its hitbox and rewards `points * difficultyMultiplier`.

---

### Tutorial C: How to Make Any Fish Trigger Dr. Marc Conrad's API Riddle
Any fish can become a special quest fish that summons the external Fish API riddle challenge!

1. In `frontend/js/fish_config.js`, set:
   ```javascript
   isSpecial: true,
   ```
2. When the player hooks this fish:
   - Gameplay instantly pauses.
   - The game client dispatches an HTTP GET request to `backend/api/fish.php?action=challenge`.
   - The PHP proxy contacts `https://www.marcconrad.com/uob/fish`, fetches a procedural fish riddle image, and stores the secret answer in the user's secure PHP session.
   - An interactive riddle modal appears with the live image.
   - Solving the puzzle awards bonus marks and sound effects!

---

### Tutorial D: How to Tune Swimming Depths and Hitbox Scales
- **Surface Water Boundary:** The water surface begins at `Y = 78px`.
- **Sea Floor Boundary:** The ocean floor is at `Y = 430px`.
- **`minDepth` / `maxDepth`:**
  - Surface/Shallow layer: `minDepth: 75`, `maxDepth: 200` (e.g. Clownfish)
  - Mid-reef layer: `minDepth: 140`, `maxDepth: 320` (e.g. Barb, Redfin)
  - Deep abyss layer: `minDepth: 240`, `maxDepth: 420` (e.g. Biolume, Angelfish)
- **`sizeX` & `sizeY`:** Controls the width and height of the fish in canvas units. The hook's collision radius automatically factors in these dimensions.

---

### Tutorial E: How to Adjust Difficulty Modes & Mission Timers
In `frontend/js/fish_config.js`, locate `DIFFICULTY_CONFIG`:
```javascript
const DIFFICULTY_CONFIG = {
    Easy: {
        duration: 90,           // Mission timer (90 seconds)
        speedMultiplier: 0.65,  // Slower fish speed for calm gameplay
        scoreMultiplier: 0.5,   // Score multiplier
        jellyfishCount: 0,      // No hazard obstacles
        zapPenalty: 0,
        dropSpeed: 7.4,         // Line drop speed
        retractSpeed: 9.2,      // Line reel-in speed
        fishCount: 9,           // Number of fish swimming simultaneously
    },
    Normal: {
        duration: 60,           // 60 seconds
        speedMultiplier: 1.0,
        scoreMultiplier: 1.0,
        jellyfishCount: 1,      // 1 electric jellyfish hazard
        zapPenalty: 120,        // Penalty marks deducted on shock
        dropSpeed: 8.6,
        retractSpeed: 10.4,
        fishCount: 11,
    },
    Hard: {
        duration: 30,           // 30 seconds frantic rush
        speedMultiplier: 1.45,
        scoreMultiplier: 2.0,
        jellyfishCount: 2,      // 2 electric jellyfish hazards
        zapPenalty: 280,
        dropSpeed: 9.8,
        retractSpeed: 11.6,
        fishCount: 13,
    },
};
```

---

### Tutorial F: How to Adjust Sequential Level Target Marks
To calibrate the marks required to clear Levels 1 through 6, edit `LEVEL_TARGET_MARKS`:
```javascript
const LEVEL_TARGET_MARKS = {
    Easy:   [350,  500,  650,  850, 1050, 1250],
    Normal: [800, 1100, 1400, 1700, 2000, 2300],
    Hard:   [1400, 1800, 2150, 2500, 2850, 3200],
};
```

---

## 4. Audio Synthesizer & Energetic BGM

The sound engine in `frontend/js/sound.js` generates all audio dynamically using the HTML5 **Web Audio API** (`AudioContext`). It requires **zero external MP3 files**, guaranteeing instant loading and zero network latency.

### Features
1. **Energetic 126 BPM Chiptune Arcade BGM:**
   - 16-step bassline sequencer running on sawtooth oscillators.
   - Bright melodic arpeggios (Pentatonic minor scale: A minor / C major).
   - Crisp white-noise hi-hat percussion on off-beats.
2. **Dynamic Sound Effects:**
   - Hook cast whistle (`playCast()`).
   - Catch bell chime (`playCatch(isRare)`).
   - Electric shock zap (`playZap()`).
   - Miss clink (`playMiss()`).
   - Level clear triumphant fanfare (`playLevelUp()`).
3. **Mute Control with Live Visual Indicator:**
   - `#muteBtn` toggles both SFX and BGM in a single click.
   - Shows a green glowing icon and `"Audio: ON"` when active.
   - Shows a red bordered muted icon and `"Audio: MUTED"` when silenced.
   - Persists player preferences to `backend/actions/update_settings.php`.

---

## 5. Viva Exam Preparation: Answering the 4 Core Themes

During your viva tomorrow, explain how your code implements the four assignment themes:

### Theme 1: Low Coupling & High Cohesion
- **Cohesion:** Every file has a single, well-defined responsibility.
  - `fish_config.js` owns data schemas and balancing.
  - `sound.js` owns audio synthesis.
  - `game.js` owns canvas physics and game loop.
  - `database.php` owns PDO connectivity.
  - `fish.php` owns external API communication.
- **Coupling:** Modules interact through clean, minimal interfaces (e.g. `window.FISH_SPECIES`, asynchronous `fetch()` API calls). If you modify the visual presentation in `style.css` or change fish points in `fish_config.js`, no backend PHP code needs to be altered.

### Theme 2: Event-Driven Programming
- **DOM Event Listeners:** User interactions trigger decoupled event handlers via `addEventListener`:
  - Boat steering via `pointermove` and `keydown` (`ArrowLeft`/`ArrowRight`/`A`/`D`).
  - Hook drop via `pointerdown` and `keydown` (`Space`/`ArrowDown`).
  - Difficulty selection via `click` event listeners on `.difficulty-card`.
  - Mute toggling via `click` on `#muteBtn`.
  - Riddle submission via `submit` on `#oracleForm`.
- **Game State Events:** Reaching level target marks emits `handleMissionOutcome()`, pausing physics and displaying the mission victory modal.

### Theme 3: Interoperability
- **Three-Tier Architecture:**  
  `Vanilla JS (Client)` ⟷ `PHP Backend Proxy (fish.php)` ⟷ `Dr. Marc Conrad Fish API (External REST Service)`
- **Anti-Cheat & Security:** The client NEVER communicates directly with the external API to inspect answers. The PHP proxy queries `https://www.marcconrad.com/uob/fish`, retains the secret answer inside `$_SESSION['oracle_answer']`, and sends only the riddle image URL to JavaScript. When the player submits their guess, PHP verifies it against the session server-side.

### Theme 4: Virtual Identity
- **User Authentication:** Registered users are saved in MySQL with cryptographic `password_hash($pass, PASSWORD_BCRYPT)`.
- **PHP Session Management:** Logged-in state is maintained via `$_SESSION['user_id']`.
- **Data Isolation:** Each player's high score, level progression (1–6), equipped lure, and audio settings are stored per user account and never conflict between different hunters.
- **Session Protection:** All backend endpoints (`save_score.php`, `save_session.php`, `fish.php`) enforce `session_start()` and reject unauthenticated requests.
