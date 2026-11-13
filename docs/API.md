# Fish Catcher REST API Documentation

Base URL: `http://localhost:4000/api`

---

## 1. System Health

### `GET /api/health`
Checks server vitality, active database driver, and security status.

- **Auth:** Public
- **Example Response (`200 OK`):**
```json
{
  "status": "healthy",
  "database": "firestore",
  "timestamp": "2026-11-13T09:45:00.000Z"
}
```

---

## 2. Authentication

### `POST /api/auth/register`
Registers a new hunter account.

- **Auth:** Public
- **Request Body:**
```json
{
  "name": "NautilusExplorer",
  "email": "hunter@ocean.io",
  "password": "Password123"
}
```
- **Example Response (`201 Created`):**
```json
{
  "token": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "state": {
    "user": {
      "id": "u49Fkd83Jkd092",
      "name": "NautilusExplorer",
      "email": "hunter@ocean.io",
      "difficulty": "Easy",
      "level": 1,
      "score": 0
    },
    "stats": {
      "bestScore": 0,
      "totalCatches": 0,
      "gamesPlayed": 0
    },
    "progress": {
      "Easy": { "currentLevel": 1, "completed": [] },
      "Normal": { "currentLevel": 1, "completed": [] },
      "Hard": { "currentLevel": 1, "completed": [] }
    },
    "settings": {
      "music": true,
      "sfx": true,
      "difficulty": "Easy",
      "lureStyle": "biolum"
    },
    "savedGame": null
  }
}
```

---

### `POST /api/auth/login`
Authenticates an existing hunter.

- **Auth:** Public
- **Request Body:**
```json
{
  "identifier": "hunter@ocean.io",
  "password": "Password123"
}
```
- **Example Response (`200 OK`):**
```json
{
  "token": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "state": { /* Game State object */ }
}
```

---

### `GET /api/auth/me`
Retrieves the logged-in hunter's profile and game state.

- **Auth:** Required (`Bearer <token>`)
- **Example Response (`200 OK`):**
```json
{
  "state": {
    "user": {
      "id": "u49Fkd83Jkd092",
      "name": "NautilusExplorer",
      "email": "hunter@ocean.io",
      "difficulty": "Easy",
      "level": 1,
      "score": 0
    },
    "stats": {
      "bestScore": 0,
      "totalCatches": 0,
      "gamesPlayed": 0
    },
    "progress": { ... },
    "settings": { ... },
    "savedGame": null
  }
}
```

---

## 3. Game Management

### `GET /api/game/state`
Alias for fetching current state.

- **Auth:** Required (`Bearer <token>`)
- **Example Response (`200 OK`):**
```json
{
  "state": { /* Game State object */ }
}
```

---

### `POST /api/game/complete`
Submits mission outcome after timer expires or objective is met. Protected by server-side anti-cheat validation.

- **Auth:** Required (`Bearer <token>`)
- **Request Body:**
```json
{
  "difficulty": "Easy",
  "level": 1,
  "score": 450,
  "catches": 5,
  "won": true
}
```
- **Example Response (`200 OK`):**
```json
{
  "state": {
    "user": {
      "id": "u49Fkd83Jkd092",
      "name": "NautilusExplorer",
      "email": "hunter@ocean.io",
      "difficulty": "Easy",
      "level": 2,
      "score": 450
    },
    "stats": {
      "bestScore": 450,
      "totalCatches": 5,
      "gamesPlayed": 1
    },
    "progress": {
      "Easy": { "currentLevel": 2, "completed": [1] },
      "Normal": { "currentLevel": 1, "completed": [] },
      "Hard": { "currentLevel": 1, "completed": [] }
    },
    "settings": { "music": true, "sfx": true, "difficulty": "Easy", "lureStyle": "biolum" },
    "savedGame": null
  },
  "isNewHighScore": true
}
```
- **Example Error Response (`400 Bad Request` if cheated):**
```json
{
  "error": "Anti-cheat: Submitted score (999999) exceeds theoretical maximum (2500) for 5 catches."
}
```

---

### `POST /api/game/save-session`
Saves an in-progress mission snapshot when paused.

- **Auth:** Required (`Bearer <token>`)
- **Request Body:**
```json
{
  "difficulty": "Normal",
  "level": 2,
  "score": 600,
  "catches": 4,
  "timeLeft": 28
}
```
- **Example Response (`200 OK`):**
```json
{
  "state": {
    /* state with savedGame snapshot populated */
  }
}
```

---

### `DELETE /api/game/save-session`
Clears a saved mission pause snapshot.

- **Auth:** Required (`Bearer <token>`)
- **Example Response (`200 OK`):**
```json
{
  "state": {
    /* state with savedGame: null */
  }
}
```

---

### `PUT /api/game/settings`
Updates audio configuration and lure style.

- **Auth:** Required (`Bearer <token>`)
- **Request Body:**
```json
{
  "music": true,
  "sfx": false,
  "difficulty": "Normal",
  "lureStyle": "solar"
}
```
- **Example Response (`200 OK`):**
```json
{
  "state": {
    "settings": {
      "music": true,
      "sfx": false,
      "difficulty": "Normal",
      "lureStyle": "solar"
    }
  }
}
```

---

### `GET /api/game/leaderboard`
Fetches the top hunters ordered by high score and catches from Firestore.

- **Auth:** Required (`Bearer <token>`)
- **Example Response (`200 OK`):**
```json
{
  "entries": [
    {
      "rank": 1,
      "id": "migrated_sqlite_1",
      "name": "admin",
      "score": 400,
      "difficulty": "Easy",
      "level": 2,
      "totalCatches": 2,
      "gamesPlayed": 1,
      "title": "Deckhand",
      "isCurrentUser": false
    }
  ]
}
```
