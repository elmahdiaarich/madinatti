const express = require('express');
const router = express.Router();
const { chat } = require('../controllers/chatController');
const { chatLimiter } = require('../middlewares/rateLimiter');

router.post('/', chatLimiter, chat);

module.exports = router;