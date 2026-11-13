# CIS045-3 Distributed Service Architectures
## 10-Minute Video Presentation Script & Defense Guide (Target: 70%+ / 1st Class)

> **Unit:** CIS045-3 Distributed Service Architectures  
> **Assignment:** Coursework 1 - Authentic Video & Code Implementation  
> **Student Deliverable:** Maximum 10-Minute Authentic Video Presentation  
> **Four Required Themes:**
> 1. Software Design Principles (Low Coupling & High Cohesion)
> 2. Event-Driven Programming
> 3. Interoperability (Integration with Dr. Marc Conrad's Fish Game API)
> 4. Virtual Identity (Authentication & Security)

---

## Video Breakdown & Timing Summary

| Section | Time | Topic | What to Show on Screen |
| :--- | :--- | :--- | :--- |
| **Intro & Demo** | 0:00 – 1:45 (1m45s) | System Overview & Live Demonstration | Browser running Fish Catcher game, catching Golden Oracle fish, solving Marc Conrad riddle, checking Firestore leaderboard |
| **Theme 1** | 1:45 – 3:45 (2m00s) | Software Design Principles (Low Coupling & High Cohesion) | Architecture diagram (`docs/ARCHITECTURE.md`), layered directory tree, `userRepository.js` vs `firestoreUserRepository.js` |
| **Theme 2** | 3:45 – 5:30 (1m45s) | Event-Driven Programming | `GameScreen.jsx` (canvas game loop, collision events, DOM key/mouse listeners) & async Promise resolution |
| **Theme 3** | 5:30 – 7:30 (2m00s) | Interoperability (Marc Conrad Fish API) | `backend/src/services/puzzleService.js`, `OraclePuzzleModal.jsx`, Network tab showing JSON exchange, `marcconrad.com` docs |
| **Theme 4** | 7:30 – 9:15 (1m45s) | Virtual Identity & Authentication | Firebase Auth console, `authMiddleware.js` (JWT token verification), Firestore database rules |
| **Conclusion** | 9:15 – 10:00 (0m45s) | Critical Reflection & Automated Test Evidence | Terminal showing `npm test` (20/20 passing), summary of architectural trade-offs |

---

## Detailed Minute-by-Minute Script

---

### Part 1: System Introduction & Live Demonstration (0:00 – 1:45)
**Screen to Show:**
1. Browser at `http://localhost:5173` showing the Fish Catcher homepage.
2. Log in with a player account.
3. Start a fishing mission. Cast the line, hook a regular fish, then hook the shimmering **"Golden Oracle of Conrad"** (Legendary Fish).
4. The **Oracle Riddle Modal** appears showing the procedural image from Dr. Marc Conrad's API (`https://marcconrad.com/uob/fish/api.php`).
5. Type the count of fish in the picture, click **"Submit Guess"**, receive the "+1500 Bonus Marks" banner.
6. Open the **Leaderboard** showing your score updated in real-time.

**What to Say:**
> *"Hello, my name is [Your Name], and this is my video presentation for CIS045-3 Distributed Service Architectures. Today, I am demonstrating my distributed game application: **Fish Catcher**, and critically reflecting on the four core themes: software design principles, event-driven programming, third-party interoperability, and virtual identity.*
>
> *Let's start with a quick live demonstration. I log in as a registered hunter. The game loads my cloud profile and saved preferences directly from Google Cloud Firestore. As I cast my hook into the ocean, you can see various aquatic species swimming with procedural physics.*
>
> *Here comes the rare, glowing **Golden Oracle of Conrad fish**—the highest scoring creature in the game. When I catch it, notice how the game triggers an external challenge from Dr. Marc Conrad's Fish Game API. This puzzle image is dynamically fetched from Dr. Conrad's server at the University of Bedfordshire. I inspect the picture, count the fish, and submit my answer. The server verifies my guess, awards 1500 bonus marks, and updates the global leaderboard stored in Cloud Firestore.*
>
> *Now, let us examine the four architectural themes underpinning this system."*

---

### Part 2: Theme 1 — Software Design Principles: Low Coupling & High Cohesion (1:45 – 3:45)
**Screen to Show:**
1. Open VS Code showing the backend folder structure:
   - `backend/src/routes/`
   - `backend/src/controllers/`
   - `backend/src/services/`
   - `backend/src/repositories/`
   - `backend/src/middleware/`
2. Open `docs/ARCHITECTURE.md` (show Mermaid diagram).
3. Open `backend/src/repositories/userRepository.js` side-by-side with `backend/src/services/gameService.js`.

**What to Say:**
> *"Our first theme is Software Design Principles, specifically focusing on **Low Coupling** and **High Cohesion**.*
>
> ***High Cohesion** means that each component in the system is dedicated to one single, well-defined responsibility. In my backend, I have strictly separated concerns into distinct architectural layers:*
> - *First, the **Routing layer** (`gameRoutes.js`) only maps HTTP endpoints and applies middleware. It contains no business logic.*
> - *Second, the **Controller layer** (`gameController.js`) only handles HTTP requests, extracts parameters, and formats JSON responses with appropriate status codes.*
> - *Third, the **Service layer** (`gameService.js`, `scoreValidator.js`) encapsulates pure domain business logic, such as level progression and anti-cheat physics verification.*
> - *Finally, the **Repository layer** (`firestoreUserRepository.js`) is solely responsible for database interactions with Google Cloud Firestore.*
>
> *At the same time, the system achieves **Low Coupling** through the **Dependency Inversion Principle (DIP)**. Notice `backend/src/repositories/userRepository.js`. High-level business services never depend directly on Google Cloud Firestore SDK calls. Instead, they depend on an abstracted repository facade. If we ever wanted to swap Firestore for another database engine or an in-memory mock for automated unit testing, we only update the repository implementation—the business services require zero modifications.*
>
> *Furthermore, the client and server are loosely coupled over a stateless RESTful HTTP interface using JSON. The React frontend knows nothing about Firestore schemas, and the Express backend knows nothing about React rendering lifecycles."*

---

### Part 3: Theme 2 — Event-Driven Programming (3:45 – 5:30)
**Screen to Show:**
1. Open `frontend/src/components/GameScreen.jsx`.
2. Scroll to:
   - The Canvas `requestAnimationFrame` game loop (`updateGame`).
   - The DOM keyboard listeners (`keydown`, `keyup` for arrow keys and spacebar).
   - The collision detection logic where the hook coordinates intersect fish bounding boxes.
   - The asynchronous event trigger for the Oracle Puzzle modal (`setShowPuzzleModal(true)`).

**What to Say:**
> *"The second theme is **Event-Driven Programming**. Event-driven architectures rely on producing, detecting, and reacting to state changes and events asynchronously rather than following a rigid linear execution flow.*
>
> *In Fish Catcher, event-driven programming operates across three distinct levels:*
>
> *First, at the **User Interface level**, React attaches non-blocking event listeners to the DOM window—listening for `keydown` and `keyup` events to control hook descent, reel-in, and boat movement. Mouse click events trigger hook deployment.*
>
> *Second, within the **HTML5 Canvas Game Loop**, the application uses `requestAnimationFrame` to drive a 60-frame-per-second update loop. Here, the engine continuously checks for **Collision Events**. When the hook's Cartesian coordinates `(hookX, hookY)` intersect with a swimming fish's bounding box, a hook event is generated. If the hooked creature is the special Golden Oracle fish, it raises a custom gameplay event that pauses the animation loop and mounts the `OraclePuzzleModal` component.*
>
> *Third, at the **Network and Server level**, Node.js and Express are fundamentally built upon the **Event Loop**. Every HTTP request, file read, or external network call returns a Promise. Node.js delegates these I/O operations to the libuv thread pool and invokes our controller callbacks only when the corresponding I/O event resolves, ensuring the server remains non-blocking and capable of serving concurrent players."*

---

### Part 4: Theme 3 — Interoperability: Dr. Marc Conrad's Fish Game API (5:30 – 7:30)
**Screen to Show:**
1. Open `backend/src/services/puzzleService.js`.
2. Open Chrome DevTools Network Tab showing the request to `/api/game/puzzle/challenge`.
3. Open `https://marcconrad.com/uob/fish/doc.php` in the browser to show Dr. Marc Conrad's official API documentation.
4. Show the sequence diagram in `docs/ARCHITECTURE.md` (Section 3).

**What to Say:**
> *"The third theme is **Interoperability**—the ability of disparate systems to communicate, exchange data, and work together using open, standardized protocols.*
>
> *As specified in our coursework assignment brief, my game integrates with **Dr. Marc Conrad's Fish Game API** hosted at `https://marcconrad.com/uob/fish/api.php`. This web service generates procedural counting puzzles featuring fish and treasure chests.*
>
> *Now, from an architectural standpoint, there is a critical security challenge: Dr. Conrad's API returns a JSON payload containing both the question image URL AND the solution: `{ question: '...', fish: 4, chest: 1 }`. If my React client queried this API directly, any student or player could simply open the Chrome Developer Tools Network tab, inspect the response, and see the exact answer before submitting!*
>
> *To solve this and achieve enterprise-grade interoperability, I designed a **Secure Proxy Pattern** in `backend/src/services/puzzleService.js`:*
> 1. *When the player catches the Oracle fish, the frontend calls my Express backend: `GET /api/game/puzzle/challenge`.*
> 2. *Express makes an outbound HTTPS call to Dr. Conrad's web service using the native `fetch` API, parsing the JSON data stream.*
> 3. *Our server extracts the secret solution (`data.fish`), generates a cryptographically random UUID `puzzleId`, and caches the answer securely in memory with a 5-minute time-to-live.*
> 4. *Our server strips the answer completely and sends only the image URL and `puzzleId` to the browser.*
> 5. *When the player submits their guess, Express verifies it against the server-stored token. If correct, the token is consumed (single-use pattern) and the player receives 1500 bonus marks.*
>
> *In addition, I implemented **resilience and fault tolerance**: if Dr. Conrad's external server is ever unreachable or down, `puzzleService.js` catches the network error and automatically falls back to an offline challenge so the game never crashes."*

---

### Part 5: Theme 4 — Virtual Identity & Authentication (7:30 – 9:15)
**Screen to Show:**
1. Open `backend/src/middleware/authMiddleware.js`.
2. Open Firebase Console showing Authentication users and Firestore collections: `users`, `scores`, `gameSessions`.
3. Show `backend/src/services/scoreValidator.js` to highlight server-side trust boundaries.

**What to Say:**
> *"The fourth theme is **Virtual Identity**. In distributed systems, virtual identity addresses how we establish who a user is, verify their identity across network boundaries, and authorize their actions.*
>
> *For Fish Catcher, virtual identity is implemented using a **Decentralized Token-Based Architecture** with **Google Firebase Authentication** and **Firebase Admin SDK**:*
> - *When a player logs in on the React frontend, Firebase Auth issues a cryptographically signed **JSON Web Token (JWT)**, known as a Firebase ID token.*
> - *Every subsequent request to our Express REST API includes this token in the HTTP `Authorization: Bearer <TOKEN>` header.*
> - *In `backend/src/middleware/authMiddleware.js`, our server uses the Google Firebase Admin SDK to cryptographically verify the token's RS256 signature using Google's public key certificates. We verify that the token has not expired and belongs to our project `fishcatcher-60484`.*
> - *The verified User ID (`uid`) is attached to `req.userId`.*
>
> *Crucially, we follow the core distributed systems principle: **Never Trust the Client**. In `backend/src/services/scoreValidator.js`, we enforce strict server-side anti-cheat validation. Even if an attacker tampers with the JavaScript code in their browser to send a fraudulent score of 1 million points, our server calculates the physical catch rate limits and mathematical bounds for that difficulty mode, immediately rejecting forged inputs with an HTTP 400 Bad Request before anything can touch Cloud Firestore.*
>
> *Furthermore, our Firestore security rules strictly deny all direct client access—only our authenticated Express backend using service account credentials can read or write to Firestore collections."*

---

### Part 6: Critical Reflection, Automated Tests & Conclusion (9:15 – 10:00)
**Screen to Show:**
1. Terminal: Run `npm --prefix backend test`.
2. Show all **20 tests passing across 5 suites** (API integration, Auth middleware, Puzzle Service interoperability, Repository layer, Score Validator).
3. Summary slide or concluding screen.

**What to Say:**
> *"To ensure rigorous software quality, I developed a comprehensive automated test suite using Node.js's native test runner. As you can see running live in the terminal right now, all 20 tests across 5 test suites pass with a 100% success rate, validating our API contracts, auth middleware, Dr. Conrad's puzzle integration, Firestore repository, and anti-cheat score engine.*
>
> *In critical reflection, while the layered architecture and secure proxy pattern introduce an extra network hop compared to direct client-to-database connections, they provide indispensable benefits in security, separation of concerns, data integrity, and maintainability.*
>
> *Thank you for your time, and I welcome any questions."*

---

## Key Academic Terminology Checklist (Mention These to Guarantee High Marks)

| Theme | Academic Keywords to Pronounce Clearly |
| :--- | :--- |
| **Design Principles** | Separation of Concerns (SoC), Single Responsibility Principle (SRP), Dependency Inversion Principle (DIP), High Cohesion, Low Coupling, Repository Pattern, Abstraction Layer, Architectural Tiers. |
| **Event-Driven Programming** | Asynchronous Non-blocking I/O, Event Loop, Libuv Thread Pool, DOM Event Delegation, Canvas Animation Frame (`requestAnimationFrame`), State Transition, Collision Event Handling. |
| **Interoperability** | RESTful Architecture, HTTP/HTTPS Protocol, JSON Data Serialization, Service-Oriented Architecture (SOA), Secure Proxy Pattern, Single-Use Token Pattern, Fault Tolerance & Graceful Degradation. |
| **Virtual Identity** | JSON Web Tokens (JWT), RS256 Cryptographic Signature, Asymmetric Encryption, Firebase Admin SDK, Bearer Token Authentication, Principal Identity, Trust Boundary, Anti-Cheat Validation. |

---

## Anticipated Tutor Questions & Model Answers

### Q1: *"Why did you proxy Dr. Marc Conrad's API through your Express backend instead of calling it directly from React?"*
> **Answer:** *"Calling it directly from React creates a severe security flaw: Dr. Conrad's API returns the answer (`fish`) in the plain JSON payload alongside the image URL. Any player inspecting the browser's Network tab would immediately see the answer. By routing it through my Express backend in `puzzleService.js`, the server isolates the answer, generates a single-use UUID challenge token, and sends only the picture to the client. This implements the Secure Proxy architectural pattern."*

### Q2: *"How does your system demonstrate High Cohesion and Low Coupling?"*
> **Answer:** *"High cohesion is achieved by having each module do only one job: `gameRoutes.js` only routes URLs, `authMiddleware.js` only validates JWT tokens, `scoreValidator.js` only computes physics limits, and `firestoreUserRepository.js` only executes Firestore queries. Low coupling is achieved through the Dependency Inversion Principle using `userRepository.js` as an abstraction facade, meaning business services have zero direct dependencies on low-level database drivers."*

### Q3: *"How do you prevent a malicious player from hacking their client and submitting a 1,000,000 score?"*
> **Answer:** *"Under the principle of 'Never Trust Client Input', all score submissions pass through `scoreValidator.js`. The validator calculates the maximum possible catches physically achievable in that mission duration (e.g. 30 seconds in Hard mode allows at most 20 catches based on 1.5s hook mechanics) and computes the mathematical ceiling based on maximum fish base points (1500 for the Oracle) plus bonuses. If submitted metrics exceed this boundary, the server rejects the request with an HTTP 400 Bad Request error."*
