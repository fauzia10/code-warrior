// routes/leaderboard.js
const express = require('express');
const router  = express.Router();
const { dbAll } = require('../database/db');

router.get('/', (req, res) => {
  try {
    const users = dbAll(
      'SELECT u.id, u.username, u.avatar, ps.level, ps.xp, ps.monsters_defeated, ps.correct_answers FROM users u JOIN player_stats ps ON u.id = ps.user_id ORDER BY ps.level DESC, ps.xp DESC LIMIT 20',
      []
    );
    // Add rank numbers
    const leaderboard = users.map((p, i) => ({ ...p, rank: i + 1 }));
    res.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to load leaderboard.' });
  }
});

module.exports = router;
