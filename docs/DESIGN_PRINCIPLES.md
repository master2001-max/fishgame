# Software Design Principles in Fish Catcher

This document outlines how professional software engineering principles are applied throughout the Fish Catcher codebase. Use this as direct evidence for your university coursework and code defense.

---

## 1. Single Responsibility Principle (SRP)
> *"A class or module should have one, and only one, reason to change."*

| Principle in Action | File Name | Explanation |
| :--- | :--- | :--- |
| **HTTP Routing** | `backend/src/routes/gameRoutes.js` | Only responsible for mapping URL endpoints to middleware and controllers. Contains zero SQL/Firestore logic. |
| **HTTP Handling** | `backend/src/controllers/gameController.js` | Only unpacks HTTP parameters (`req.body`, `req.userId`) and returns HTTP status codes. Contains no game logic. |
| **Game Domain Logic** | `backend/src/services/gameService.js` | Governs game state, progression rules, and rank titles. Does not handle HTTP headers or raw database queries. |
| **Anti-Cheat Validation** | `backend/src/services/scoreValidator.js` | Strictly dedicated to verifying the physical feasibility and mathematical bounds of game scores. |
| **Data Persistence** | `backend/src/repositories/firestoreUserRepository.js` | Solely responsible for Cloud Firestore reads, writes, and document mapping. |

---

## 2. Dependency Inversion Principle (DIP)
> *"High-level modules should not depend on low-level modules. Both should depend on abstractions."*

| Principle in Action | File Name | Explanation |
| :--- | :--- | :--- |
| **Repository Facade** | `backend/src/repositories/userRepository.js` | The `gameService` and `authService` import `userRepository`. They have no dependency on SQLite or Firestore SDKs. |
| **Driver Swappability** | `backend/src/repositories/sqliteUserRepository.js` & `firestoreUserRepository.js` | Both repositories adhere to the identical method signature contract (`findById`, `updateMissionOutcome`, `findLeaderboard`), allowing the database driver to be toggled via `DB_DRIVER` in `.env` without modifying a single line of business logic. |

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
