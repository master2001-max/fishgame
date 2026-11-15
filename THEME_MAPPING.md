# Academic Theme Mapping (CIS045-3 Coursework Defense)

This document provides direct evidence and code line mappings for the **four core themes** evaluated in unit **CIS045-3 Distributed Service Architectures**.

---

## Theme 1: Low Coupling and High Cohesion

> *"High cohesion means keeping parts of a code base that are related to each other in a single place. Low coupling means separating parts of the code base that are unrelated as much as possible."*

### High Cohesion Evidence:
Every file has one focused responsibility:

| File Name | Cohesive Responsibility | What It Does NOT Do |
| :--- | :--- | :--- |
| `config/database.php` | Establishing the PDO connection and session validation helpers | Does not process form inputs or render HTML. |
| `actions/login_action.php` | Authenticating credentials against bcrypt hashes and starting sessions | Does not draw canvas graphics or calculate game physics. |
| `actions/save_score.php` | Enforcing anti-cheat mathematical score limits and sequential level locks | Does not manage HTTP redirects or third-party web services. |
| `api/fish.php` | Interoperating with Dr. Marc Conrad's external Fish Game API | Does not render DOM components or handle password checks. |
| `js/game.js` | Governing 60 FPS HTML5 Canvas arcade animation, hook physics, and collisions | Does not write SQL or interact directly with MySQL. |
| `js/sound.js` | Procedurally synthesizing sound effects using native Web Audio API oscillators | Does not contain application business logic. |
| `css/style.css` | Defining all visual presentation, deep-sea gradients, and glassmorphism | Contains zero JavaScript or server code. |

### Low Coupling Evidence:
- **Client Decoupled from Database:** `js/game.js` never executes SQL. It interacts with the backend strictly through asynchronous JSON APIs (`fetch('actions/save_score.php')`).
- **Backend Decoupled from Client Frameworks:** `actions/save_score.php` outputs raw JSON. It does not depend on whether the frontend is Vanilla JS, React, or mobile.
- **Client Decoupled from External Web Service:** The client browser never communicates directly with `marcconrad.com`. It invokes `api/fish.php`, allowing the backend to act as an abstraction proxy.

---

## Theme 2: Event-Driven Programming

> *"The flow of the program is determined by events such as user actions (mouse clicks, key presses), sensor outputs, or message passing between distributed components."*

### Exact Code Evidence in `js/game.js`:

1. **Boat Steering Events (Mouse/Touch):**
   ```javascript
   // Listens for horizontal pointer move events across the ocean surface
   this.canvas.addEventListener('pointermove', (e) => {
       if (this.isPaused || this.missionStatus !== 'playing') return;
       this.sim.targetBoatX = getCanvasX(e.clientX);
   });
   ```
2. **Hook Cast Events (Click/Tap):**
   ```javascript
   // Listens for pointerdown events to cast the hook
   this.canvas.addEventListener('pointerdown', (e) => {
       if (this.isPaused || this.missionStatus !== 'playing') return;
       this.triggerDrop();
   });
   ```
3. **Keyboard Controls (Keydown Events):**
   ```javascript
   window.addEventListener('keydown', (e) => {
       if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') this.sim.keys.left = true;
       if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') this.sim.keys.right = true;
       if (e.key === ' ' || e.key === 'ArrowDown') {
           e.preventDefault();
           this.triggerDrop();
       }
       if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
           this.togglePause();
       }
   });
   ```
4. **Asynchronous Riddle Submission Event:**
   ```javascript
   // Submitting the counting riddle guess dispatches an async verification event
   document.getElementById('oracleForm').addEventListener('submit', (e) => {
       e.preventDefault();
       this.handleOracleSubmit();
   });
   ```
5. **Periodic Timer Events:**
   ```javascript
   // Timer countdown ticks every 1000ms
   this.timerInterval = setInterval(() => { ... }, 1000);
   // Animation frame event renders 60 FPS loop
   this.animationId = requestAnimationFrame((now) => this.render(now));
   ```

---

## Theme 3: Interoperability

> *"The ability of computer systems or software to exchange and make use of information across different platforms and networks."*

### Exact Code Evidence in `api/fish.php`:

1. **Protocol:** HTTP GET over HTTPS with JSON formatting.
2. **External Endpoint:** `https://marcconrad.com/uob/fish/api.php?out=json`
3. **Server-to-Server Communication (cURL):**
   ```php
   // Server-to-server request from Apache PHP to Dr. Marc Conrad's REST service
   $ch = curl_init();
   curl_setopt($ch, CURLOPT_URL, 'https://marcconrad.com/uob/fish/api.php?out=json');
   curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
   curl_setopt($ch, CURLOPT_TIMEOUT, 6);
   $response = curl_exec($ch);
   $apiData = json_decode($response, true);
   ```
4. **Data Isolation (Architectural Secure Proxy Pattern):**
   ```php
   // Isolates the secret answer on the PHP server in session storage
   $_SESSION['current_puzzle'] = [
       'puzzle_id' => $puzzleId,
       'solution'  => (int)$apiData['fish'],
       'user_id'   => $userId
   ];

   // Returns ONLY the question image to the browser
   sendJsonResponse([
       'puzzleId' => $puzzleId,
       'imageUrl' => $apiData['question'],
       'prompt'   => 'Count the number of fish in the picture to unlock the Golden Oracle bonus!'
   ]);
   ```
5. **Single-Use Challenge Token:**
   Upon answering, `unset($_SESSION['current_puzzle'])` consumes the token, preventing replay attacks.
6. **Cross-Platform Interop:**
   Data flows smoothly:  
   `Browser (Vanilla JS) ➔ Apache (PHP) ➔ External Web Service (marcconrad.com) ➔ Apache ➔ Browser`.

---

## Theme 4: Virtual Identity

> *"The creation and maintenance of a verifiable digital representation of a user across stateless interactions."*

### Exact Code Evidence:

1. **Credential Registration (`actions/register_action.php`):**
   ```php
   // Hashes plain-text passwords using strong BCRYPT cryptography
   $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
   ```
2. **Credential Authentication (`actions/login_action.php`):**
   ```php
   // Cryptographically verifies user identity
   if (!password_verify($password, $user['password'])) {
       // Reject 401 Unauthorized
   }
   // Prevent session fixation attack
   session_regenerate_id(true);
   ```
3. **Session State Binding (`config/database.php`):**
   ```php
   // Establishes virtual identity in server memory
   $_SESSION['user_id'] = (int)$user['id'];
   $_SESSION['user_name'] = $user['name'];

   // Enforces identity verification on protected pages
   function requireAuth() {
       if (!isset($_SESSION['user_id']) || empty($_SESSION['user_id'])) {
           header('Location: login.php');
           exit;
       }
   }
   ```
4. **Identity-Bound Persistence (`actions/save_score.php`):**
   When saving high scores or completing levels, the player's ID is retrieved directly from `$_SESSION['user_id']`. The client cannot spoof another player's progress.
5. **Session Destruction (`logout.php`):**
   Clears `$_SESSION`, deletes the cookie token, and calls `session_destroy()`.
