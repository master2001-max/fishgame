# Fish Catcher Technical Glossary

This glossary is designed to help you confidently explain technical architectural terms to your university lecturer and during project demonstrations.

---

### 1. Layered Architecture
**What it is:** An architectural design pattern where code is separated into distinct horizontal tiers, each with a single responsibility.  
**In our project:**
- **Routes:** Direct URLs to handlers.
- **Middleware:** Checks security and authentication before controllers run.
- **Controllers:** Handle HTTP status codes and responses.
- **Services:** Execute business and game logic (anti-cheat checks, level rules).
- **Repositories:** Read and write data to the database.

---

### 2. Middleware
**What it is:** Software that sits between an incoming HTTP network request and the final controller handler.  
**Analogy:** Like a security guard at an airport checking boarding passes before allowing passengers to enter the gate.  
**In our project:**
- `authMiddleware.js`: Checks the `Authorization: Bearer <token>` header, verifies the cryptographic signature with Google, and rejects unauthorized requests with `401 Unauthorized`.
- `validate.js`: Checks incoming JSON against Zod schemas, returning `400 Bad Request` if required fields are missing or invalid.
- `helmet`: Attaches security headers to protect against browser exploits.
- `rateLimit`: Throttles excessive requests to prevent brute-force attacks.

---

### 3. Repository Pattern & Dependency Inversion Principle (DIP)
**What it is:** An architectural pattern that separates the data storage logic from business logic. The high-level code (services) depends on an abstraction (the repository interface), rather than knowing about raw SQL or Firestore SDK calls.  
**Why it matters:**
- If you switch from SQLite to Firestore, MongoDB, or PostgreSQL, you only rewrite the repository file. The game rules (`gameService.js`) remain completely unchanged.
**In our project:**
- `userRepository.js` acts as a facade.
- `firestoreUserRepository.js` implements data access for Google Cloud Firestore.
- `sqliteUserRepository.js` implements data access for local SQLite.

---

### 4. Firebase Client SDK vs. Firebase Admin SDK
**What it is:** Two completely different libraries provided by Google with different security privileges:
- **Firebase JS Client SDK (in React):** Runs in the user's browser. It has **zero direct access** to Firestore in our architecture because our Firestore Security Rules are set to `allow read, write: if false;`. It is used exclusively to sign the user in with their password and receive a cryptographically signed ID Token.
- **Firebase Admin SDK (in Express):** Runs exclusively on our secure backend server. It uses a private Service Account key (`serviceAccountKey.json`) that grants full administrator rights to read and write to Firestore collections and verify ID tokens.

---

### 5. Firebase ID Token (JWT)
**What it is:** A JSON Web Token issued by Google upon successful user authentication in the browser. It contains:
- `uid`: The user's unique Firebase user identifier.
- `email`: The verified email address.
- `exp`: An expiration timestamp (typically 1 hour).
- **Cryptographic Signature:** Signed using Google's private cryptographic keys.
**Why it matters:** The client cannot fake this token. When Express verifies it via `admin.auth().verifyIdToken()`, Google's public keys prove that the user is genuinely who they claim to be.

---

### 6. Anti-Cheat & Server-Side Score Validation
**What it is:** The security practice of validating game calculations on the server rather than blindly trusting the score reported by the browser.  
**In our project (`scoreValidator.js`):**
- Calculates the maximum possible score given the fish species available and the difficulty multiplier.
- Checks that the catch count is physically possible within the level's countdown timer.
- Rejects impossible submissions with `400 Bad Request`.

---

### 7. Idempotency
**What it is:** A property of an operation where running it once or running it multiple times yields the exact same outcome without causing unwanted side effects.  
**In our project:**
- `migrateSqliteToFirestore.js` is idempotent: running it once migrates the data; running it a second time detects existing documents and skips them safely without duplicating data.
