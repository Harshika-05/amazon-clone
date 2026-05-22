const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', wishlistController.getWishlist);
router.post('/items', wishlistController.addToWishlist);
router.delete('/items/:productId', wishlistController.removeFromWishlist);

module.exports = router;
