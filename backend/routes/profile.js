// routes/profile.js
const express = require('express');
const router = express.Router();
const { getProfile, updateAvatar, getAchievements, getBattleHistory } = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/achievements', authMiddleware, getAchievements);
router.get('/history', authMiddleware, getBattleHistory);
router.put('/avatar', authMiddleware, updateAvatar);
router.get('/:userId', getProfile); // Public — anyone can view a profile

module.exports = router;
