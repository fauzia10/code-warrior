// routes/auth.js
const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', register);           // Public
router.post('/login', login);                 // Public
router.get('/me', authMiddleware, getMe);     // Protected

module.exports = router;
