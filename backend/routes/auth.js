const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// signup flow
router.post('/register', authController.register);

// login flow
router.post('/login', authController.login);
router.post('/verify-login-otp', authController.verifyLoginOtp);

// protected — needs valid token
router.get('/me', authMiddleware, authController.getMe);

// otp helpers
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.get('/test-email', authController.testEmailConfig);

module.exports = router;
