// server.js
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { initDB } = require('./database/db');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:5000'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

// Lazy-load database middleware for serverless/Vercel compatibility
let dbInitialized = false;
let dbInitPromise = null;

async function ensureDB() {
  if (!dbInitialized) {
    if (!dbInitPromise) {
      dbInitPromise = initDB().then(() => {
        dbInitialized = true;
      });
    }
    await dbInitPromise;
  }
}

app.use(async (req, res, next) => {
  try {
    await ensureDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.use('/api/auth',        require('./routes/auth'));
app.use('/api/game',        require('./routes/game'));
app.use('/api/profile',     require('./routes/profile'));
app.use('/api/leaderboard', require('./routes/leaderboard'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: '⚔️ Code Warrior API is running!' });
});

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found.' });
  }
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

// ── Initialize DB and start server locally (ignored on Vercel) ─────────────
if (!process.env.VERCEL) {
  ensureDB().then(() => {
    app.listen(PORT, () => {
      console.log(`\n⚔️  Code Warrior Backend running at http://localhost:${PORT}`);
      console.log(`📡  Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌐  Open the game: http://localhost:${PORT}\n`);
    });
  }).catch(err => {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
  });
}

module.exports = app;
