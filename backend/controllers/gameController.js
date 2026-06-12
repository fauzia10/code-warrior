// controllers/gameController.js
const { dbGet, dbAll, dbRun } = require('../database/db');

function xpToNextLevel(level) { return level * 100; }

function getDamage(difficulty, isCorrect) {
  const DAMAGE = { easy: { correct: 10, wrong: 5 }, medium: { correct: 20, wrong: 10 }, hard: { correct: 30, wrong: 15 } };
  const entry = DAMAGE[difficulty] || DAMAGE.easy;
  return isCorrect ? entry.correct : entry.wrong;
}

// ─── GET /api/game/monsters ──────────────────────────────────────────────────
function getMonsters(req, res) {
  try {
    const stats    = dbGet('SELECT level FROM player_stats WHERE user_id = ?', [req.userId]);
    const monsters = dbAll('SELECT * FROM monsters WHERE level_required <= ? ORDER BY level_required ASC', [stats.level]);
    res.json({ monsters });
  } catch (error) {
    console.error('getMonsters error:', error);
    res.status(500).json({ error: 'Failed to load monsters.' });
  }
}

// ─── POST /api/game/battle/start ─────────────────────────────────────────────
function startBattle(req, res) {
  try {
    const { monsterId } = req.body;
    if (!monsterId) return res.status(400).json({ error: 'monsterId is required.' });

    const monster = dbGet('SELECT * FROM monsters WHERE id = ?', [monsterId]);
    if (!monster) return res.status(404).json({ error: 'Monster not found.' });

    const stats = dbGet('SELECT * FROM player_stats WHERE user_id = ?', [req.userId]);

    // Random question from monster's category
    const questions = dbAll(
      'SELECT id, category, difficulty, question_text, option_a, option_b, option_c, option_d FROM questions WHERE category = ?',
      [monster.category]
    );
    if (!questions.length) return res.status(404).json({ error: 'No questions found for this category.' });
    const question = questions[Math.floor(Math.random() * questions.length)];

    res.json({ monster, playerHp: stats.hp, playerMaxHp: stats.max_hp, playerLevel: stats.level, question });
  } catch (error) {
    console.error('startBattle error:', error);
    res.status(500).json({ error: 'Failed to start battle.' });
  }
}

// ─── POST /api/game/battle/answer ────────────────────────────────────────────
function answerQuestion(req, res) {
  try {
    const { questionId, selectedOption, currentMonsterHp, currentPlayerHp, monsterId } = req.body;
    if (!questionId || !selectedOption) return res.status(400).json({ error: 'questionId and selectedOption are required.' });

    const question = dbGet('SELECT * FROM questions WHERE id = ?', [questionId]);
    if (!question) return res.status(404).json({ error: 'Question not found.' });

    const isCorrect    = selectedOption.toLowerCase() === question.correct_option;
    const damage       = getDamage(question.difficulty, isCorrect);
    const newMonsterHp = isCorrect ? Math.max(0, currentMonsterHp - damage) : currentMonsterHp;
    const newPlayerHp  = isCorrect ? currentPlayerHp : Math.max(0, currentPlayerHp - damage);

    const stats = dbGet('SELECT * FROM player_stats WHERE user_id = ?', [req.userId]);
    const newStreak     = isCorrect ? stats.current_streak + 1 : 0;
    const newBestStreak = Math.max(stats.best_streak, newStreak);

    dbRun(
      'UPDATE player_stats SET correct_answers = correct_answers + ?, wrong_answers = wrong_answers + ?, current_streak = ?, best_streak = ? WHERE user_id = ?',
      [isCorrect ? 1 : 0, isCorrect ? 0 : 1, newStreak, newBestStreak, req.userId]
    );

    // Get next question (different from current)
    const monster = dbGet('SELECT category FROM monsters WHERE id = ?', [monsterId]);
    const allQs = dbAll(
      'SELECT id, category, difficulty, question_text, option_a, option_b, option_c, option_d FROM questions WHERE category = ? AND id != ?',
      [monster?.category || question.category, questionId]
    );
    const nextQuestion = allQs.length ? allQs[Math.floor(Math.random() * allQs.length)] : null;

    res.json({ isCorrect, correctOption: question.correct_option, explanation: question.explanation, damage, newMonsterHp, newPlayerHp, nextQuestion, streak: newStreak });
  } catch (error) {
    console.error('answerQuestion error:', error);
    res.status(500).json({ error: 'Failed to process answer.' });
  }
}

// ─── POST /api/game/battle/end ───────────────────────────────────────────────
function endBattle(req, res) {
  try {
    const { monsterId, outcome, questionsAnswered, correctCount, xpGained } = req.body;

    const monster = dbGet('SELECT * FROM monsters WHERE id = ?', [monsterId]);
    const stats   = dbGet('SELECT * FROM player_stats WHERE user_id = ?', [req.userId]);

    const coinsEarned = outcome === 'win' ? (monster?.coin_reward || 0) : 0;
    const totalXp     = outcome === 'win' ? ((xpGained || 0) + (monster?.xp_reward || 0)) : (xpGained || 0);

    let newXp    = stats.xp + totalXp;
    let newLevel = stats.level;
    let leveledUp = false;
    while (newXp >= xpToNextLevel(newLevel)) {
      newXp -= xpToNextLevel(newLevel);
      newLevel++;
      leveledUp = true;
    }

    const newMaxHp = stats.max_hp + (leveledUp ? 10 : 0);
    let   newHp    = outcome === 'win' ? Math.min(stats.hp + 20, newMaxHp) : Math.max(stats.hp, 10);
    if (leveledUp) newHp = newMaxHp;

    dbRun(
      'UPDATE player_stats SET xp = ?, level = ?, coins = coins + ?, hp = ?, max_hp = ?, total_battles = total_battles + 1, monsters_defeated = monsters_defeated + ?, current_streak = 0 WHERE user_id = ?',
      [newXp, newLevel, coinsEarned, newHp, newMaxHp, outcome === 'win' ? 1 : 0, req.userId]
    );

    dbRun(
      'INSERT INTO battle_history (user_id, monster_id, outcome, questions_answered, correct_count, xp_gained) VALUES (?,?,?,?,?,?)',
      [req.userId, monsterId, outcome, questionsAnswered || 0, correctCount || 0, totalXp]
    );

    const updatedStats    = dbGet('SELECT * FROM player_stats WHERE user_id = ?', [req.userId]);
    const newAchievements = checkAchievements(req.userId, updatedStats);

    res.json({ outcome, xpGained: totalXp, coinsEarned, newXp, newLevel, leveledUp, newHp, newMaxHp, newAchievements });
  } catch (error) {
    console.error('endBattle error:', error);
    res.status(500).json({ error: 'Failed to save battle results.' });
  }
}

function checkAchievements(userId, stats) {
  const allAchievements = dbAll('SELECT * FROM achievements', []);
  const unlocked        = dbAll('SELECT achievement_id FROM user_achievements WHERE user_id = ?', [userId]);
  const unlockedIds     = new Set(unlocked.map(u => u.achievement_id));
  const newlyUnlocked   = [];

  for (const achievement of allAchievements) {
    if (unlockedIds.has(achievement.id)) continue;
    let earned = false;
    const val  = achievement.condition_value;
    switch (achievement.condition_type) {
      case 'monsters_defeated': earned = stats.monsters_defeated >= val; break;
      case 'correct_answers':   earned = stats.correct_answers   >= val; break;
      case 'best_streak':       earned = stats.best_streak       >= val; break;
      case 'total_battles':     earned = stats.total_battles     >= val; break;
      case 'level':             earned = stats.level             >= val; break;
      case 'coins':             earned = stats.coins             >= val; break;
    }
    if (earned) {
      dbRun('INSERT OR IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)', [userId, achievement.id]);
      newlyUnlocked.push(achievement);
    }
  }
  return newlyUnlocked;
}

module.exports = { getMonsters, startBattle, answerQuestion, endBattle };
