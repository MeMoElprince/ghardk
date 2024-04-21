const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const productController = require('../controllers/productController');

router.route('/')
        .post(productController.createProduct)
        .get(productController.getAllProducts);

module.exports = router;