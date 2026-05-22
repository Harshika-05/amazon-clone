const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');

// Public endpoint for email preview redirect
router.get('/:id/email-preview', orderController.getEmailPreview);

router.use(authMiddleware);

router.post('/', orderController.placeOrder);
router.get('/history', orderController.getOrderHistory);
router.get('/:id', orderController.getOrderById);
router.patch('/:id/cancel', orderController.cancelOrder);

module.exports = router;
