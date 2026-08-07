const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const shopController = require('../controllers/shopController');

router.get('/plans', shopController.getPlans);
router.get('/public/:slug', shopController.getPublicShop);

router.get('/me', authMiddleware, shopController.getMyShops);
router.get('/dashboard', authMiddleware, shopController.getDashboard);
router.put('/account-boutique', authMiddleware, roleMiddleware('business'), shopController.updateAccountBoutique);
router.post('/', authMiddleware, shopController.createShop);
router.put('/:id', authMiddleware, shopController.updateShop);
router.post('/:id/change-plan', authMiddleware, shopController.changePlan);
router.post('/payment-actions/:action', authMiddleware, shopController.paymentAction);

router.get('/admin/list', authMiddleware, roleMiddleware('admin'), shopController.listAdminShops);
router.patch('/admin/:id', authMiddleware, roleMiddleware('admin'), shopController.adminUpdateShop);

module.exports = router;
