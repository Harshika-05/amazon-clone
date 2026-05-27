const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// public — no auth needed
router.get('/', productController.getProducts);
router.get('/categories', productController.getCategories);
router.get('/:id', productController.getProductById);

module.exports = router;
