# Software Design Principles in Fish Catcher

This document outlines how professional software engineering principles are applied throughout the Fish Catcher codebase. Use this as direct evidence for your university coursework and code defense for unit **CIS045-3 Distributed Service Architectures**.

---

## 1. Low Coupling & High Cohesion (Core Coursework Theme 1)

> *"High cohesion means keeping parts of a code base that are related to each other in a single place. Low coupling means at the same time separating parts of the code base that are unrelated as much as possible."*

### High Cohesion in Action
Every module in Fish Catcher is strictly focused on doing **one cohesive job**:

| Module | Cohesive Responsibility | What It Does NOT Do |
| :--- | :--- | :--- |
| `backend/src/services/puzzleService.js` | Managing external Marc Conrad Fish Game API challenges, riddle tokens, and bonus awards | Does NOT handle HTTP requests, express routing, or canvas rendering. |
| `backend/src/services/scoreValidator.js` | Anti-cheat mathematical verification of scores, catch rates, and physical time constraints | Does NOT touch the database or format HTTP responses. |
| `backend/src/middleware/authMiddleware.js` | Cryptographic JWT token extraction and Firebase Admin ID token verification | Does NOT load user inventory or manage game sessions. |
| `backend/src/repositories/firestoreUserRepository.js` | Low-level Cloud Firestore document querying, writing, and schema mapping | Does NOT contain business rules or validation logic. |
| `frontend/src/components/OraclePuzzleModal.jsx` | UI rendering of the counting puzzle riddle and user guess submission | Does NOT communicate directly with external APIs; delegates to `api.js`. |

### Low Coupling in Action
Modules in Fish Catcher interact only through clean, abstracted interfaces:

- **Frontend Decoupled from Backend Protocol:** The React components (`GameScreen.jsx`, `OraclePuzzleModal.jsx`) never construct raw HTTP headers or fetch URLs. They invoke `gameApi.getPuzzleChallenge()` and `gameApi.verifyPuzzle()` defined in `frontend/src/utils/api.js`. If the backend API routing changes, React components require zero edits.
- **Business Logic Decoupled from Database Engine:** The services (`authService.js`, `gameService.js`, `puzzleService.js`) never import Google Cloud Firestore directly. They interact with `userRepository.js`.
- **Client Decoupled from Third-Party Service (Secure Proxy):** The React frontend never connects directly to `marcconrad.com`. The Express backend acts as a mediator, abstracting the external API structure and preventing client tampering.

---

## 2. Single Responsibility Principle (SRP)
> *"A class or module should have one, and only one, reason to change."*

| Principle in Action | File Name | Explanation |
| :--- | :--- | :--- |
| **HTTP Routing** | `backend/src/routes/gameRoutes.js` | Only responsible for mapping URL endpoints to middleware and controllers. Contains zero database logic. |
| **HTTP Handling** | `backend/src/controllers/gameController.js` | Only unpacks HTTP parameters (`req.body`, `req.userId`) and returns HTTP status codes. Contains no game logic. |
| **External Interoperability** | `backend/src/services/puzzleService.js` | Exclusively coordinates third-party riddle generation and solution token verification. |
| **Game Domain Logic** | `backend/src/services/gameService.js` | Governs game state, progression rules, and rank titles. Does not handle HTTP headers or raw database queries. |
| **Anti-Cheat Validation** | `backend/src/services/scoreValidator.js` | Strictly dedicated to verifying the physical feasibility and mathematical bounds of game scores. |
| **Data Persistence** | `backend/src/repositories/firestoreUserRepository.js` | Solely responsible for Cloud Firestore reads, writes, and document mapping. |

---

## 3. Dependency Inversion Principle (DIP)
> *"High-level modules should not depend on low-level modules. Both should depend on abstractions."*

| Principle in Action | File Name | Explanation |
| :--- | :--- | :--- |
| **Repository Facade** | `backend/src/repositories/userRepository.js` | High-level services (`gameService`, `authService`, `puzzleService`) depend on the abstract repository interface rather than tight coupling to Firestore SDK details. |
| **Pluggable Data Access** | `firestoreUserRepository.js` | The implementation satisfies standard method signatures (`findById`, `updateMissionOutcome`, `findLeaderboard`), so data storage details can be replaced or mocked in unit tests without altering business logic. |

---

## 3. Don't Repeat Yourself (DRY)
> *"Every piece of knowledge must have a single, unambiguous, authoritative representation within a system."*

| Principle in Action | File Name | Explanation |
| :--- | :--- | :--- |
| **Centralized Config** | `backend/src/config/env.js` | All environment variables and fallbacks are defined in one central module instead of repeating `process.env.XYZ` across the codebase. |
| **Zod Validation Middleware** | `backend/src/middleware/validate.js` | A single higher-order middleware factory (`validateBody(schema)`) is reused across all routes rather than writing repetitive manual `if (!body.x)` checks in controllers. |
| **Normalized Progress** | `backend/src/services/gameService.js` | The `normalizeProgress` helper ensures the exact same data structure is returned across login, mission complete, session save, and settings update. |

---

## 4. Separation of Concerns (SoC)
> *"Separating a computer program into distinct sections such that each section addresses a separate concern."*

- **Client vs. Server Boundary:**
  - `frontend/src/components/GameScreen.jsx` runs game rendering and audio.
  - `backend/src/services/scoreValidator.js` validates that game outcomes are mathematically valid.
- **Security Boundary:**
  - `firestore.rules` blocks all direct client database access.
  - `backend/src/config/firebase.js` ensures only Express handles database mutations using the Admin SDK.

---

## 5. Fail-Fast Principle
> *"Immediately report any failure or input anomaly at the boundary of a component."*

- `backend/src/middleware/validate.js` validates payloads against Zod schemas before any controller is executed.
- `backend/src/services/scoreValidator.js` immediately throws an `AppError(400)` if a player submits a score with 0 catches or exceeds the physical countdown duration.
