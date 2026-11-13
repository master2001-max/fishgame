# Fish Catcher Architecture & Request Lifecycle

This document provides a comprehensive technical overview of the Fish Catcher system architecture and walks through the end-to-end lifecycle of a sample request from the React frontend down to Google Cloud Firestore and back.

---

## 1. System Architecture Diagram

```mermaid
flowchart TD
    subgraph Browser["Client Tier (React Browser Application)"]
        UI["React UI (GameScreen / MainMenu / Login)"]
        FB_CLIENT["Firebase Client SDK (Auth Only)"]
        API_UTIL["API Fetch Client (utils/api.js)"]
    end

    subgraph ExpressServer["Application Tier (Node.js & Express REST API)"]
        HELMET["Security Layer (Helmet, CORS, Rate Limit)"]
        AUTH_MW["Auth Middleware (ID Token Verification)"]
        VAL_MW["Validation Middleware (Zod Schemas)"]
        ROUTERS["Routers (/api/auth, /api/game)"]
        CTRL["Controllers (authController, gameController)"]
        SERV["Services (authService, gameService, scoreValidator)"]
        REPO["Repository Facade (userRepository.js)"]
    end

    subgraph GoogleCloud["Data Tier (Google Cloud Platform)"]
        FB_ADMIN["Firebase Admin SDK"]
        FIRESTORE[("Cloud Firestore\n• users\n• scores\n• gameSessions")]
        FB_AUTH["Firebase Authentication Service"]
    end

    UI --> API_UTIL
    UI -.->|1. Email & Password| FB_CLIENT
    FB_CLIENT -.->|2. Sign-in| FB_AUTH
    FB_AUTH -.->|3. Signed ID Token| FB_CLIENT
    
    API_UTIL -->|4. HTTP Request + Bearer Token| HELMET
    HELMET --> AUTH_MW
    AUTH_MW -->|5. Verify Token| FB_ADMIN
    FB_ADMIN <-->|Cryptographic Check| FB_AUTH
    AUTH_MW --> VAL_MW
    VAL_MW --> ROUTERS
    ROUTERS --> CTRL
    CTRL --> SERV
    SERV --> REPO
    REPO -->|6. Firestore Mutations| FB_ADMIN
    FB_ADMIN --> FIRESTORE
```

---

## 2. Step-by-Step Walkthrough: "Submit a Score"

Here is the exact lifecycle of what happens when a player completes a fishing mission and submits their score:

```mermaid
sequenceDiagram
    autonumber
    actor Player
    participant UI as GameScreen.jsx
    participant Fetch as api.js
    participant Server as Express Server
    participant AuthMW as authMiddleware.js
    participant ValMW as validate.js (Zod)
    participant GameCtrl as gameController.js
    participant GameSvc as gameService.js
    participant AntiCheat as scoreValidator.js
    participant Repo as firestoreUserRepository.js
    participant Firestore as Google Cloud Firestore

    Player->>UI: Catches final fish / Timer ends
    UI->>Fetch: completeMission({ difficulty, level, score, catches, won })
    Fetch->>Server: POST /api/game/complete (Header: Bearer <ID_TOKEN>)
    
    Server->>AuthMW: requireAuth()
    AuthMW->>AuthMW: admin.auth().verifyIdToken(token)
    Note over AuthMW: Verifies token with Google. Sets req.userId
    
    AuthMW->>ValMW: validateBody(completeMissionSchema)
    Note over ValMW: Verifies types and integer ranges using Zod
    
    ValMW->>GameCtrl: completeMission(req, res, next)
    GameCtrl->>GameSvc: completeMission(userId, payload)
    
    GameSvc->>AntiCheat: validateMissionOutcome(payload)
    Note over AntiCheat: Verifies catch count <= max duration allowed<br/>Verifies score <= mathematical upper bound
    
    GameSvc->>Repo: updateMissionOutcome(userId, updateData)
    Repo->>Firestore: update doc `users/{userId}`
    Repo->>Firestore: upsert doc `scores/{userId}` (Leaderboard)
    Repo->>Firestore: delete doc `gameSessions/{userId}`
    
    Repo-->>GameSvc: Return updated user domain object
    GameSvc-->>GameCtrl: Return client state + isNewHighScore
    GameCtrl-->>Fetch: HTTP 200 OK (JSON payload)
    Fetch-->>UI: Update React state (HUD, unlocked levels)
    UI-->>Player: Display Victory Screen & Hunter Rank
```

### Detailed Stage Breakdown:

1. **Trigger (React):** In `GameScreen.jsx`, the mission timer reaches 0 or target marks are reached. React triggers `handleMissionComplete({ difficulty: 'Normal', level: 1, score: 950, catches: 7, won: true })`.
2. **Transport (`utils/api.js`):** Attaches `Authorization: Bearer <ID_TOKEN>` and dispatches a `POST` request to `/api/game/complete`.
3. **Security Headers (`helmet`):** In `app.js`, Helmet attaches `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and strict CORS policies.
4. **Token Verification (`authMiddleware.js`):** Extracts the Bearer token. Uses `admin.auth().verifyIdToken(token)` via Firebase Admin SDK. Cryptographically verifies that the token was signed by Google, hasn't expired, and belongs to `fishcatcher-60484`. Extracts `decodedToken.uid` into `req.userId`.
5. **Schema Validation (`validate.js`):** Uses Zod to ensure `difficulty` is one of `['Easy', 'Normal', 'Hard']`, `level` is an integer between 1 and 6, and `score` and `catches` are non-negative numbers.
6. **Controller Dispatch (`gameController.js`):** Extracts `req.userId` and invokes `gameService.completeMission`.
7. **Anti-Cheat Validation (`scoreValidator.js`):**
   - Validates that the catch count (7) does not exceed physical limits for Normal mode (60 seconds / 1.5s per catch = 40 max).
   - Validates that the score (950) does not exceed the maximum possible points for 7 catches with pearls and the 1.0x multiplier.
8. **Progression Verification (`gameService.js`):** Checks that the user is currently on Level 1 (cannot submit Level 2 if Level 1 is not unlocked). If `won === true`, advances user's sequential level to Level 2.
9. **Atomic Database Mutation (`firestoreUserRepository.js`):**
   - Updates `users/{userId}` with new level, cumulative catches, and progress map.
   - Upserts `scores/{userId}` with high score and rank title for the public leaderboard.
   - Deletes any paused state in `gameSessions/{userId}`.
10. **Response Flow:** Returns `{ state, isNewHighScore }` with HTTP `200 OK` to the frontend, which unlocks Level 2 on the Main Menu and updates audio and stats.

---

## 3. Third-Party Web Service Interoperability (Marc Conrad Fish Game API)

To satisfy the **Interoperability** theme of the CIS045-3 Distributed Service Architectures unit, the system integrates with an external RESTful web service provided by the University of Bedfordshire:
**Dr. Marc Conrad's Fish Game API** (`https://marcconrad.com/uob/fish/api.php?out=json`).

### Architectural Secure Proxy Pattern
The external web service returns both the question image URL (`question`) and the numerical solution (`fish`). 

> [!CAUTION] Security Risk of Direct Client Calls
> If the browser called Dr. Conrad's API directly, any user inspecting the Network tab in DevTools would immediately see the answer in the JSON response, defeating the riddle challenge.

To preserve game integrity and demonstrate enterprise distributed systems design, our Node.js backend acts as a **Secure Proxy & Challenge Authority**:

```mermaid
sequenceDiagram
    autonumber
    actor Player
    participant UI as GameScreen / Modal
    participant Express as Express Backend
    participant PuzzleSvc as puzzleService.js
    participant ConradAPI as Dr. Marc Conrad API (marcconrad.com)
    participant Firestore as Cloud Firestore

    Player->>UI: Catches "Golden Oracle of Conrad" (Legendary Fish)
    UI->>Express: GET /api/game/puzzle/challenge (Bearer Token)
    Express->>PuzzleSvc: createChallenge(userId)
    PuzzleSvc->>ConradAPI: HTTPS GET /uob/fish/api.php?out=json
    ConradAPI-->>PuzzleSvc: { question: "imageUrl", fish: 4, chest: 1 }
    
    Note over PuzzleSvc: Separates solution from challenge.<br/>Generates UUID puzzleId.<br/>Stores puzzleId -> { solution: 4, userId } in memory.
    
    PuzzleSvc-->>Express: Return { puzzleId, imageUrl, prompt }
    Express-->>UI: HTTP 200 OK (Solution stripped!)
    UI-->>Player: Displays Oracle riddle modal with counting image
    
    Player->>UI: Enters answer (e.g. 4)
    UI->>Express: POST /api/game/puzzle/verify { puzzleId, answer: 4 }
    Express->>PuzzleSvc: verifyAnswer(userId, { puzzleId, answer })
    
    Note over PuzzleSvc: Verifies user ownership & answer == 4.<br/>Consumes puzzleId (Single-use token).
    
    PuzzleSvc->>Firestore: update doc `users/{userId}` (+1500 Bonus Marks)
    PuzzleSvc-->>Express: Return { correct: true, bonusMarks: 1500 }
    Express-->>UI: HTTP 200 OK
    UI-->>Player: Confirms victory, awards +1500 points, resumes game loop
```

