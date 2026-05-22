const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');

// Public: anyone can read reviews
router.get('/:productId', reviewController.getProductReviews);

// Protected: must be logged in to write/delete reviews
router.post('/', authMiddleware, reviewController.upsertReview);
router.delete('/:productId', authMiddleware, reviewController.deleteReview);

module.exports = router;
