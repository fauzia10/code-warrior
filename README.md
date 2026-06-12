# ⚔️ Code Warrior: The Placement Quest

A gamified coding + aptitude learning platform where you battle monsters by answering technical questions.

## Quick Start

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Seed the database (run ONCE)
```bash
npm run seed
```

### 3. Start the server
```bash
npm run dev
```

### 4. Open the game
Visit: **http://localhost:5000**

---

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend | Node.js + Express.js |
| Database | SQLite (via better-sqlite3) |
| Auth | JWT + bcrypt |

## Features
- 🔐 Secure user auth (hashed passwords + JWT)
- ⚔️ Battle 14 unique monsters across 7 categories
- 📚 36+ curated coding & aptitude questions
- ⚡ XP & Leveling system (level-up restores HP!)
- 💰 Coin rewards
- 🏅 10 unlockable achievements
- 🏆 Live leaderboard with podium
- 💾 Auto-saved progress

## Categories
- Programming Basics · Arrays · Strings · OOP · DBMS · OS · Aptitude

## Folder Structure
```
code-warrior/
├── backend/
│   ├── server.js
│   ├── database/ (db.js, seed.js)
│   ├── routes/   (auth, game, profile, leaderboard)
│   ├── controllers/
│   └── middleware/
└── frontend/
    ├── index.html  (Auth)
    ├── game.html   (Battle Arena)
    ├── profile.html
    ├── leaderboard.html
    ├── css/ (main.css, animations.css)
    └── js/  (api.js, auth.js, game.js, profile.js, leaderboard.js)
```
