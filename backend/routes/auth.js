const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getMe);
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);

module.exports = router;
