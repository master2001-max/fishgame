# Architecture Comparison: Original vs. Migrated

**Module:** CIS045-3 Distributed Service Architectures  
**Project:** Fish Catcher Game

---

## 1. High-Level Comparison Table

| Dimension | Original Architecture | Migrated Architecture (Current) | Academic Benefit for Viva |
| :--- | :--- | :--- | :--- |
| **Client UI Tier** | React 19, JSX, Vite, Tailwind CSS | HTML5 Semantic Pages, CSS3, Vanilla JS | Transparent DOM & Canvas rendering without obfuscated compiler bundles. |
| **Styling** | Tailwind CSS compiled via Node.js | Single pure CSS file (`css/style.css`) | Easy to inspect, edit, and explain line-by-line during viva. |
| **Client Game Engine** | React Component (`GameScreen.jsx`) with hooks | Vanilla JS Class (`js/game.js`) | Direct 60 FPS requestAnimationFrame loop; no React re-render overhead. |
| **Audio System** | Web Audio API inside React wrapper | Standalone `js/sound.js` Synthesizer | Reusable procedural Web Audio synth; zero external asset dependencies. |
| **Application Server** | Node.js + Express.js REST API | Apache HTTP Server + PHP 8.2 (XAMPP) | Standard distributed server setup taught and evaluated in university labs. |
| **Database Tier** | Google Cloud Firestore (NoSQL Documents) | MySQL / MariaDB Relational Database | Clear schema, foreign keys (`ON DELETE CASCADE`), and SQL queries. |
| **Database Driver** | Firebase Admin SDK | PHP Data Objects (PDO) with Prepared Statements | Direct defense of SQL injection prevention and prepared queries. |
| **Authentication** | Firebase Auth + Custom JWT Bearer Tokens | Native PHP Sessions (`PHPSESSID`) + bcrypt | Classic stateful session-based virtual identity. |
| **Password Storage** | Cloud managed by Google Firebase | `password_hash()` & `password_verify()` | Candidate can show the exact hashing algorithm (BCRYPT) in code. |
| **External API Proxy** | Node.js `puzzleService.js` (fetch) | PHP `api/fish.php` (cURL & sessions) | Secure Proxy pattern clearly demonstrated in clean PHP scripts. |

---

## 2. Component-by-Component Mapping

### A. Frontend Mapping

```text
ORIGINAL (React/Node)                   MIGRATED (HTML/CSS/JS/PHP)
─────────────────────────────────────────────────────────────────────────────
frontend/src/App.jsx               ───► includes/header.php, index.php
frontend/src/components/Login.jsx  ───► login.php
frontend/src/components/Register.jsx──► register.php
frontend/src/components/MainMenu.jsx──► dashboard.php
frontend/src/components/GameScreen.jsx► game.php & js/game.js
frontend/src/components/Leaderboard.jsx►leaderboard.php
frontend/src/components/Settings.jsx ─► gear.php
frontend/src/components/OceanBackdrop.jsx includes/header.php (.ocean-backdrop)
frontend/src/utils/sound.js        ───► js/sound.js
frontend/src/index.css             ───► css/style.css
```

### B. Backend Mapping

```text
ORIGINAL (Express/Node/Firebase)        MIGRATED (PHP/MySQL)
─────────────────────────────────────────────────────────────────────────────
backend/src/routes/authRoutes.js   ───► actions/login_action.php
                                        actions/register_action.php
backend/src/services/authService.js───► config/database.php (session checks)
backend/src/services/gameService.js───► actions/save_score.php
                                        actions/save_session.php
                                        actions/update_settings.php
backend/src/services/scoreValidator.js► actions/save_score.php (Anti-Cheat)
backend/src/services/puzzleService.js─► api/fish.php (Marc Conrad Fish API)
backend/src/repositories/firestore.js ─► config/database.php (PDO queries)
Cloud Firestore Collections        ───► database/fish_catcher.sql (MySQL tables)
```

---

## 3. Database Schema Evolution

### Original (Cloud Firestore NoSQL Documents):
- `users/{uid}`: Stored denormalized JSON objects with embedded settings and progress.
- `scores/{uid}`: Mirrored high scores for querying.
- `gameSessions/{uid}`: Paused snapshots.

### Migrated (MySQL Relational Schema):
- **`users` Table:**
  - `id` (INT AUTO_INCREMENT PRIMARY KEY)
  - `name` (VARCHAR(50) UNIQUE)
  - `email` (VARCHAR(100) UNIQUE)
  - `password` (VARCHAR(255) - Bcrypt hash)
  - `difficulty`, `level`, `score`, `total_catches`, `games_played`
  - `progress` (TEXT JSON: `{"Easy":{"currentLevel":1,"completed":[]},...}`)
  - `settings` (TEXT JSON: `{"music":true,"sfx":true,...}`)
  - `saved_game` (TEXT JSON: active pause snapshot)
  - `created_at`, `updated_at` (TIMESTAMPS)
- **`scores` Table:**
  - `id` (INT AUTO_INCREMENT PRIMARY KEY)
  - `user_id` (INT UNIQUE, FOREIGN KEY REFERENCES `users(id)` ON DELETE CASCADE)
  - `name`, `score`, `difficulty`, `level`, `total_catches`, `games_played`
  - INDEX on `(score DESC, total_catches DESC)` for high-performance ranking.

---

## 4. Why This Architecture is Superior for Your University Viva

1. **Self-Contained & Deterministic:**  
   The entire system runs on a standard XAMPP stack on localhost without depending on third-party cloud service credentials, Firebase keys, or external build tools like Vite.
2. **Transparent Code Flow:**  
   Instead of tracing through complex React state reconciliations, hooks, and virtual DOM diffing, every request has a visible, linear flow:  
   `HTML Form / Fetch ➔ PHP Action ➔ PDO Prepared Statement ➔ MySQL ➔ JSON / HTML Response`.
3. **Direct Evidence of Coursework Themes:**  
   Every single academic theme required by unit CIS045-3 is prominently isolated in its own dedicated, easy-to-explain file.
