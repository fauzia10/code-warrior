// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { dbGet, dbRun } = require('../database/db');

function createToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// ─── POST /api/auth/register ────────────────────────────────────────────────
async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ error: 'Username, email, and password are all required.' });
    if (username.length < 3 || username.length > 20)
      return res.status(400).json({ error: 'Username must be 3–20 characters.' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    if (!email.includes('@'))
      return res.status(400).json({ error: 'Please enter a valid email address.' });

    const existing = dbGet('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
    if (existing)
      return res.status(409).json({ error: 'An account with that email or username already exists.' });

    const password_hash = await bcrypt.hash(password, 12);
    const result = dbRun(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, password_hash]
    );
    const userId = result.lastInsertRowid;
    dbRun('INSERT INTO player_stats (user_id) VALUES (?)', [userId]);

    const token = createToken(userId);
    res.status(201).json({
      message: 'Account created! Welcome to the arena, warrior!',
      token,
      user: { id: userId, username, email, avatar: '🧙' },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error during registration.' });
  }
}

// ─── POST /api/auth/login ────────────────────────────────────────────────────
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const user = dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (!user)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const stats = dbGet('SELECT * FROM player_stats WHERE user_id = ?', [user.id]);
    dbRun('UPDATE player_stats SET hp = max_hp WHERE user_id = ?', [user.id]);

    const token = createToken(user.id);
    res.json({
      message: `Welcome back, ${user.username}!`,
      token,
      user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar },
      stats: { ...stats, hp: stats.max_hp },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login.' });
  }
}

// ─── GET /api/auth/me ────────────────────────────────────────────────────────
function getMe(req, res) {
  try {
    const user  = dbGet('SELECT id, username, email, avatar, created_at FROM users WHERE id = ?', [req.userId]);
    const stats = dbGet('SELECT * FROM player_stats WHERE user_id = ?', [req.userId]);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user, stats });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
}

module.exports = { register, login, getMe };
