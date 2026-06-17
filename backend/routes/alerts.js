const express = require('express');
const router  = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { getMyAlerts, createAlert, deleteAlert } = require('../controllers/alertController');

router.use(authMiddleware);
router.get('/',     getMyAlerts);
router.post('/',    createAlert);
router.delete('/:id', deleteAlert);

module.exports = router;