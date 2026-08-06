'use strict';

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const ctrl = require('../controllers/subscriptionController');

router.get('/plans', ctrl.getPlans);
router.get('/me', authMiddleware, roleMiddleware('business'), ctrl.getMySubscription);
router.post('/checkout', authMiddleware, roleMiddleware('business'), ctrl.checkoutSubscription);

module.exports = router;
