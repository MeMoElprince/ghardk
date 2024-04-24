const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const productController = require('../controllers/productController');
const cartRouter = require('./cartRouter');

router.use('/:productId/carts/', cartRouter);

router.route('/myProducts')
        .post(authController.protect, authController.restrictTo('vendor'), productController.createNewProduct)
        .get(authController.protect, authController.restrictTo('vendor'), productController.getAllMyProducts);

router.route('/myProducts/:id')
        // .get(authController.protect, authController.restrictTo('vendor'), productController.getMyProduct)
        .patch(authController.protect, authController.restrictTo('vendor'), productController.updateMyProduct)
        .delete(authController.protect, authController.restrictTo('vendor'), productController.deleteMyProduct);

router.route('/')
        .post(productController.createProduct)
        .get(productController.getAllProducts);

router.route('/:id')
        .get(productController.getProduct)
        .patch(productController.updateProduct)
        .delete(productController.deleteProduct);


module.exports = router;