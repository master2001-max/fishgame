# Fish Catcher (PHP / XAMPP / MySQL Edition)

**Module:** CIS045-3 Distributed Service Architectures  
**Tech Stack:** HTML5, CSS3, Vanilla JavaScript, PHP 8.2+, MySQL / MariaDB, XAMPP  
**External Web Service:** Dr. Marc Conrad's Fish Game API (`https://marcconrad.com/uob/fish/api.php?out=json`)

---

## 1. Overview

Fish Catcher is a 2D deep-sea arcade game migrated from a React/Node/Firebase architecture to a clean, decoupled **PHP + MySQL + Vanilla JavaScript + HTML5/CSS3** application running on XAMPP.

The project demonstrates the four core software architecture themes of CIS045-3:
1. **Low Coupling & High Cohesion**
2. **Event-Driven Programming**
3. **Interoperability (External REST Web Service Integration)**
4. **Virtual Identity (Authentication & Session State)**

---

## 2. Project Directory Structure

```text
fishCatcher/
│
├── index.php             # Root router forwards directly to frontend/index.php
├── README.md             # Project documentation & execution guide
├── VIVA_GUIDE.md         # Comprehensive viva defense guide with question/answers
├── ARCHITECTURE_COMPARISON.md # React/Firebase vs PHP/MySQL comparison
├── THEME_MAPPING.md      # Mapping to the 4 academic themes
│
├── frontend/             # HTML5, CSS3, Vanilla JS Presentation Layer
│   ├── index.php         # Router: directs authenticated hunters to dashboard, guests to login
│   ├── login.php         # Hunter sign-in page
│   ├── register.php      # New hunter registration page
│   ├── dashboard.php     # Hunter's Hub: rank, difficulty cards, level track (1-6)
│   ├── game.php          # 60 FPS HTML5 Canvas ocean arena with HUD & interactive modals
│   ├── leaderboard.php   # Live Top 50 podium & ranking table from MySQL
│   ├── gear.php          # Hunter's Gear: audio toggles, difficulty selector, lure rig
│   ├── logout.php        # Destroys session and cleans authentication cookies
│   │
│   ├── css/
│   │   └── style.css     # Ocean glassmorphism design system & animations
│   ├── js/
│   │   ├── game.js       # HTML5 Canvas physics engine, boat, hook, fish swarm, hazards
│   │   └── sound.js      # Web Audio API procedural synthesizer (zero sound asset files)
│   ├── images/
│   │   ├── favicon.svg   # Brand icon
│   │   └── icons.svg     # SVG sprite assets
│   └── includes/
│       ├── header.php    # HTML5 head, Google Fonts, CSS, ocean backdrop
│       └── footer.php    # Closes container, injects sound.js synthesizer engine
│
└── backend/              # PHP 8.2 + MySQL Service & Data Layer
    ├── config/
    │   └── database.php  # PDO database connection, session checks, helper functions
    ├── actions/
    │   ├── login_action.php    # Validates credentials with password_verify()
    │   ├── register_action.php # Hashes passwords with password_hash(PASSWORD_BCRYPT)
    │   ├── save_score.php      # Anti-cheat validator, sequential level unlock, updates MySQL
    │   ├── save_session.php    # Saves in-progress paused game snapshot
    │   ├── clear_session.php   # Clears active pause snapshot
    │   └── update_settings.php # Persists audio and difficulty settings to database
    ├── api/
    │   ├── fish.php          # Secure Proxy & Challenge Authority for Marc Conrad Fish API
    │   └── leaderboard_api.php # JSON endpoint for top hunter scores
    └── database/
        └── fish_catcher.sql  # Complete relational MySQL schema with test seed data
```

---

## 3. How to Run Using XAMPP

### Step 1: Start XAMPP
1. Open the **XAMPP Control Panel**.
2. Click **Start** next to **Apache**.
3. Click **Start** next to **MySQL**.

### Step 2: Import the Database
1. Open your web browser and navigate to:  
   `http://localhost/phpmyadmin/`
2. Click the **Import** tab at the top.
3. Click **Choose File** and select:  
   `backend/database/fish_catcher.sql`
4. Click **Import** (or **Go**) at the bottom.
5. The `fish_catcher` database will be created with `users` and `scores` tables and initial sample accounts.

### Step 3: Deploy or Copy the Project
Ensure the `fishCatcher` folder is located inside your XAMPP `htdocs` directory:  
`C:\xampp\htdocs\fishCatcher\`

### Step 4: Open the Game in Your Browser
Visit:  
👉 **`http://localhost/fishCatcher/`**

*(This automatically routes to `http://localhost/fishCatcher/frontend/index.php`)*

---

## 4. Default Seed Test Accounts

You can log in immediately with any of the pre-seeded hunter accounts:

| Role | Username / Identifier | Email | Password | Starting Level & Mode |
| :--- | :--- | :--- | :--- | :--- |
| **Abyss Master** | `AbyssMaster` | `abyss@ocean.io` | `Password123` | Hard Mode · Level 4 (3,800 pts) |
| **Explorer** | `NautilusExplorer` | `hunter@ocean.io` | `Password123` | Normal Mode · Level 3 (2,450 pts) |
| **Reef Drifter** | `CoralDrifter` | `coral@ocean.io` | `Password123` | Easy Mode · Level 2 (950 pts) |

Or click **Create Hunter Profile** on `frontend/login.php` to register a brand new account!

---

## 5. Controls & How to Play

- **Steer Boat:** Move mouse horizontally across the water surface, or use **A / D** or **Left / Right Arrow Keys**.
- **Drop Hook:** **Click anywhere**, tap on touchscreens, or press **Spacebar / Down Arrow**.
- **Pause Mission:** Press **Escape** or **P**, or click the **Pause** button in the HUD.
- **Audio Toggle:** Click the **Speaker icon** in the HUD or Hunter's Gear to toggle audio.
- **Special Golden Oracle Fish:** When you catch the rare, glowing Golden Oracle fish, Dr. Marc Conrad's Fish API is invoked over HTTPS to generate a procedural counting riddle. Count the fish in the picture (0-9) to claim **+1,500 Bonus Marks**!
- **Hazards:** Avoid pulsing pink jellyfish tentacles! Contact delivers an electric zap and deducts penalty marks.
- **Bonus:** Hook sunken pearl oysters resting on the ocean floor to gain **+250 marks** and **+5 seconds** of extra mission time.
