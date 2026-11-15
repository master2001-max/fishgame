# Fish Catcher - Academic Viva Defense Guide

**Unit:** CIS045-3 Distributed Service Architectures  
**Candidate Preparation:** Comprehensive Walkthrough & Viva Q&A

---

## 1. Overall System Architecture

Fish Catcher follows a clean **3-Tier Distributed Architecture**:

```text
[ CLIENT TIER (Browser) ]
  • HTML5 (Page Structure & Semantic Elements)
  • CSS3 (Deep Sea Aesthetics, Glassmorphism, Responsive Grid)
  • Vanilla JavaScript (Canvas 2D Rendering Engine, Web Audio API Synth, Event Listeners)
          │
          │ HTTP / JSON (fetch, form POST, session cookies)
          ▼
[ APPLICATION TIER (XAMPP Apache & PHP 8.2) ]
  • Router & Views (index.php, dashboard.php, game.php, leaderboard.php, gear.php)
  • Action Controllers (actions/login_action.php, save_score.php, etc.)
  • Database Config & Security Layer (config/database.php - PDO, password_hash)
  • Secure Proxy & Challenge Authority (api/fish.php)
          │                                           │
          │ PDO / SQL                                 │ HTTPS GET / JSON
          ▼                                           ▼
[ DATA TIER (MySQL Database) ]             [ EXTERNAL SERVICE TIER ]
  • fish_catcher                              • Dr. Marc Conrad's Fish API
    - users table                               (marcconrad.com/uob/fish)
    - scores table
```

---

## 2. How the Technologies Work Together

1. **HTML5 (`includes/header.php`, `game.php`, `dashboard.php`):**  
   Provides semantic markup, structure, input forms, and the `<canvas id="gameCanvas">` viewport.
2. **CSS3 (`css/style.css`):**  
   Handles all visual presentation, deep-sea bioluminescence, glassmorphism (`backdrop-filter: blur(24px)`), oceanic color palettes, and responsive layouts.
3. **Vanilla JavaScript (`js/game.js`, `js/sound.js`):**  
   Renders 60 FPS arcade animation onto HTML5 Canvas, computes fish swimming physics, handles collisions, synthesizes sound procedural via the Web Audio API, and dispatches asynchronous `fetch()` requests to the backend.
4. **PHP 8.2 (`actions/*.php`, `api/*.php`, `config/database.php`):**  
   Acts as the backend application controller. Enforces session-based authentication, anti-cheat validation, sequential level rules, communicates with MySQL via PDO prepared statements, and proxies third-party API requests.
5. **MySQL (`database/fish_catcher.sql`):**  
   Provides relational data persistence, indexing player profiles, passwords, sequential level progress, and top scores with foreign keys.

---

## 3. How Login and Registration Work

### Registration (`actions/register_action.php`):
1. The user enters their hunter name, email, and password on `register.php`.
2. The form submits via POST to `actions/register_action.php`.
3. Input validation verifies character lengths and email syntax (`filter_var`).
4. A PDO prepared statement checks for duplicate usernames or emails:
   ```php
   $stmt = $pdo->prepare("SELECT id FROM users WHERE LOWER(name) = :name OR LOWER(email) = :email");
   ```
5. Passwords are never stored in plain text; they are hashed with bcrypt:
   ```php
   $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
   ```
6. A PDO transaction inserts the user into the `users` table and initializes their profile in the `scores` table.
7. PHP session variables (`$_SESSION['user_id']`, `$_SESSION['user_name']`) are established, and the hunter is redirected to `dashboard.php`.

### Login (`actions/login_action.php`):
1. The user enters their identifier (username or email) and password on `login.php`.
2. The backend looks up the user using prepared statements:
   ```php
   $stmt = $pdo->prepare("SELECT * FROM users WHERE LOWER(name) = :ident1 OR LOWER(email) = :ident2 LIMIT 1");
   $stmt->execute([':ident1' => $cleanId, ':ident2' => $cleanId]);
   $user = $stmt->fetch();
   ```
3. Password verification is performed cryptographically using `password_verify()`:
   ```php
   if (!password_verify($password, $user['password'])) {
       // Return error 401
   }
   ```
4. `session_regenerate_id(true)` is executed to prevent session fixation attacks.
5. The player's identity is assigned to `$_SESSION['user_id']`, bootstrapping their virtual identity.

---

## 4. How PHP Sessions Implement Virtual Identity (Coursework Theme 4)

Virtual Identity means distinguishing one player from another and maintaining their ongoing state across stateless HTTP requests.

- When a player authenticates, PHP issues a cryptographically random cookie (`PHPSESSID`) to the player's browser.
- On every subsequent request, the browser sends this cookie header back to Apache.
- PHP reads the server-side session memory:
  ```php
  function requireAuth() {
      if (!isset($_SESSION['user_id']) || empty($_SESSION['user_id'])) {
          header('Location: login.php');
          exit;
      }
  }
  ```
- **Security Guarantee:** When a player completes a level and submits a score to `actions/save_score.php`, the user ID is read directly from `$_SESSION['user_id']` on the server. The client browser can never tamper with or forge another hunter's identity.

---

## 5. Low Coupling & High Cohesion (Coursework Theme 1)

### High Cohesion:
Each file has one clear, focused responsibility:
- `js/game.js`: Solely responsible for canvas animation, boat physics, and collision loops. Does not write SQL or manage sessions.
- `css/style.css`: Strictly handles visual presentation and glassmorphism. Contains no game logic.
- `config/database.php`: Focuses exclusively on establishing the PDO database connection and session checking.
- `actions/save_score.php`: Strictly responsible for anti-cheat verification and recording scores.
- `api/fish.php`: Exclusively handles communication with Dr. Marc Conrad's external web service.

### Low Coupling:
Components interact across clean, standardized interfaces:
- **UI Decoupled from Database:** `game.js` has no direct access to MySQL. It sends a simple JSON payload (`{ difficulty, level, score, catches, won }`) via `fetch()` to `actions/save_score.php`.
- **Backend Decoupled from Presentation:** `save_score.php` returns standard JSON. It does not dictate how the browser renders the victory fanfare or HUD.
- **Client Decoupled from External API:** The browser never calls Dr. Marc Conrad's server directly. It talks only to `api/fish.php`.

---

## 6. Event-Driven Programming (Coursework Theme 2)

Event-driven programming means the flow of execution is determined by events: user actions, sensor outputs, or incoming network messages.

In Fish Catcher:
1. **Pointer & Mouse Events (`js/game.js`):**
   ```javascript
   canvas.addEventListener('pointermove', (e) => {
       sim.targetBoatX = getCanvasX(e.clientX);
   });
   canvas.addEventListener('pointerdown', (e) => {
       triggerDrop(); // Drops hook
   });
   ```
2. **Keyboard Events (`js/game.js`):**
   ```javascript
   window.addEventListener('keydown', (e) => {
       if (e.key === 'ArrowLeft' || e.key === 'a') sim.keys.left = true;
       if (e.key === ' ' || e.key === 'ArrowDown') triggerDrop();
       if (e.key === 'Escape' || e.key === 'p') togglePause();
   });
   ```
3. **Form Submit Events (`login.php`, `register.php`, `game.php`):**
   Submitting riddle guesses or credential forms dispatches async network events without whole-page flicker.
4. **Game Loop Timer Events (`js/game.js`):**
   `setInterval` decrements mission time every 1,000ms; `requestAnimationFrame` triggers frame render events at 60 FPS.

---

## 7. Third-Party Web Service Interoperability (Coursework Theme 3)

### The External API:
- **Provider:** Dr. Marc Conrad (University of Bedfordshire).
- **Endpoint:** `https://marcconrad.com/uob/fish/api.php?out=json`
- **Protocol:** HTTP GET returning JSON.
- **Payload Received:**
  ```json
  {
    "question": "https://www.sanfoh.com/uob/fish/data/ch_fc1517_233014_008x004.png",
    "fish": 4,
    "chest": 8
  }
  ```

### The Architectural Secure Proxy Pattern:
> **Viva Key Point:** Why does the client browser not call `marcconrad.com` directly?  
> **Answer:** If the browser called the API directly, any student opening the DevTools Network tab would immediately see `"fish": 4` in the JSON response, cheating the riddle!

To protect game integrity:
1. The player catches the rare Golden Oracle fish.
2. `js/game.js` triggers `fetch('api/fish.php?action=challenge')`.
3. The PHP backend makes a server-to-server request via cURL:
   ```php
   $response = curl_exec($ch);
   $data = json_decode($response, true);
   ```
4. PHP strips the solution (`$data['fish'] = 4`) and saves it securely in `$_SESSION['current_puzzle']`.
5. PHP sends only `{ puzzleId, imageUrl, prompt }` to the client.
6. The player views the image modal and submits their guess (e.g., `4`).
7. `actions/fish.php?action=verify` compares the guess with `$_SESSION['current_puzzle']['solution']`.
8. The single-use token is immediately destroyed to prevent replay attacks (`unset($_SESSION['current_puzzle'])`).
9. If correct, **+1,500 Bonus Marks** are awarded directly to the hunter's profile in MySQL!

---

## 8. Anti-Cheat Engine & Sequential Level Progression

In `actions/save_score.php`:
1. **Mathematical Upper Bound:**  
   $TheoreticalMax = \lceil (Catches \times 1500 + 500_{pearl} + 3000_{oracle}) \times Multiplier \rceil$. Any score exceeding this theoretical limit is rejected with HTTP `400 Bad Request`.
2. **Physical Catch Rate Limit:**  
   In Normal mode (60 seconds), it physically takes at least 1.5 seconds to drop and retrieve the line. Submitting $> 40$ catches in 60s is physically impossible and blocked.
3. **Sequential Level Lock:**  
   Players cannot submit scores for Level 3 if their database record is currently on Level 2. Levels unlock strictly in sequence ($1 \rightarrow 2 \rightarrow 3 \rightarrow 4 \rightarrow 5 \rightarrow 6$).

---

## 9. Common Viva Questions & Accurate Model Answers

### Q1: What are the main distributed architectural themes in your project?
> **Answer:** My application demonstrates four themes:
> 1. **Low Coupling & High Cohesion:** Responsibilities are separated across dedicated modules (`style.css` for styling, `game.js` for canvas physics, `database.php` for PDO persistence, `api/fish.php` for external web services).
> 2. **Event-Driven Programming:** User interactions, hook casts, keyboard controls, and asynchronous API calls are coordinated using DOM event listeners.
> 3. **Interoperability:** The PHP backend interoperates over HTTPS with Dr. Marc Conrad's external Fish Game API using HTTP GET and JSON.
> 4. **Virtual Identity:** User accounts, encrypted password hashing (`password_hash`), and PHP session identifiers (`$_SESSION`) maintain player-specific state and progress.

### Q2: Why did you migrate from Firebase to MySQL and PHP?
> **Answer:** Firebase uses proprietary client-side SDKs and cloud-managed NoSQL databases that obscure underlying distributed systems concepts. By migrating to PHP PDO and MySQL on XAMPP, our architecture explicitly demonstrates prepared statements, relational database normalization (`users` and `scores` tables with foreign keys), session lifecycle management, and transparent HTTP request/response protocols suitable for academic evaluation.

### Q3: How do you protect passwords in your database?
> **Answer:** Passwords are never stored in plain text. In `actions/register_action.php`, we use PHP's `password_hash($password, PASSWORD_BCRYPT)`. During sign-in in `actions/login_action.php`, we verify credentials using `password_verify($password, $user['password'])`. This uses slow key-stretching and random salt generation to prevent rainbow table and brute-force attacks.

### Q4: How did you implement sound without external audio files?
> **Answer:** In `js/sound.js`, we implemented a procedural synthesizer using the browser's native **Web Audio API** (`AudioContext`). It uses sine, triangle, and sawtooth oscillators (`createOscillator`), gain envelopes (`createGain`), and biquad lowpass filters (`createBiquadFilter`) to synthesize splash sounds, catch chimes, zaps, and ambient oceanic drones purely in code, requiring zero external MP3/WAV downloads.

### Q5: What is the Secure Proxy Pattern you implemented for Dr. Marc Conrad's API?
> **Answer:** Dr. Marc Conrad's API returns both the question image and the answer in the same JSON object. If the frontend called it directly, players could inspect the network traffic to see the solution. Our PHP backend acts as a proxy: it fetches the riddle, isolates the secret solution in a server-side session token, and returns only the riddle image to the browser.
