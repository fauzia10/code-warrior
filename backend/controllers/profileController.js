// controllers/profileController.js
const { dbGet, dbAll, dbRun } = require('../database/db');

function getProfile(req, res) {
  try {
    const userId = req.params.userId;
    const user   = dbGet('SELECT id, username, email, avatar, created_at FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const stats  = dbGet('SELECT * FROM player_stats WHERE user_id = ?', [userId]);
    const wins   = dbGet("SELECT COUNT(*) as count FROM battle_history WHERE user_id = ? AND outcome = 'win'", [userId]);
    const total  = dbGet('SELECT COUNT(*) as count FROM battle_history WHERE user_id = ?', [userId]);
    const winRate = total.count > 0 ? Math.round((wins.count / total.count) * 100) : 0;

    res.json({ user, stats, winRate });
  } catch (error) {
    console.error('getProfile error:', error);
    res.status(500).json({ error: 'Failed to load profile.' });
  }
}

function updateAvatar(req, res) {
  try {
    const { avatar } = req.body;
    if (!avatar || avatar.length > 10) return res.status(400).json({ error: 'Invalid avatar.' });
    dbRun('UPDATE users SET avatar = ? WHERE id = ?', [avatar, req.userId]);
    res.json({ message: 'Avatar updated!', avatar });
  } catch (error) {
    console.error('updateAvatar error:', error);
    res.status(500).json({ error: 'Failed to update avatar.' });
  }
}

function getAchievements(req, res) {
  try {
    const all    = dbAll('SELECT * FROM achievements ORDER BY condition_value ASC', []);
    const earned = dbAll('SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = ?', [req.userId]);
    const earnedMap = {};
    earned.forEach(e => { earnedMap[e.achievement_id] = e.unlocked_at; });

    const achievements = all.map(a => ({
      ...a,
      earned: !!earnedMap[a.id],
      unlocked_at: earnedMap[a.id] || null,
    }));
    res.json({ achievements });
  } catch (error) {
    console.error('getAchievements error:', error);
    res.status(500).json({ error: 'Failed to load achievements.' });
  }
}

function getBattleHistory(req, res) {
  try {
    const battles  = dbAll('SELECT * FROM battle_history WHERE user_id = ? ORDER BY played_at DESC LIMIT 20', [req.userId]);
    const monsters = dbAll('SELECT id, name, image_emoji FROM monsters', []);
    const monsterMap = {};
    monsters.forEach(m => { monsterMap[m.id] = m; });

    const history = battles.map(b => ({
      ...b,
      monster_name:  monsterMap[b.monster_id]?.name       || 'Unknown',
      monster_emoji: monsterMap[b.monster_id]?.image_emoji || '👾',
    }));
    res.json({ history });
  } catch (error) {
    console.error('getBattleHistory error:', error);
    res.status(500).json({ error: 'Failed to load battle history.' });
  }
}

module.exports = { getProfile, updateAvatar, getAchievements, getBattleHistory };
