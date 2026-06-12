// routes/game.js
const express = require('express');
const router = express.Router();
const { getMonsters, startBattle, answerQuestion, endBattle } = require('../controllers/gameController');
const authMiddleware = require('../middleware/authMiddleware');

// All game routes require the player to be logged in
router.use(authMiddleware);

router.get('/monsters', getMonsters);
router.post('/battle/start', startBattle);
router.post('/battle/answer', answerQuestion);
router.post('/battle/end', endBattle);

module.exports = router;
