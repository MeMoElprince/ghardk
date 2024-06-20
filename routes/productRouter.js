const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const productController = require('../controllers/productController');
const cartRouter = require('./cartRouter');
const reviewRouter = require('./reviewRouter');
const productImageRouter = require('./productImageRouter');

router.use('/:productId/images', productImageRouter);
router.use('/:productId/carts/', cartRouter);
router.use('/:productId/reviews', reviewRouter);

router.route('/myProducts')
        .post(authController.protect, authController.restrictTo('vendor'), productController.createNewProductItem)
        .get(authController.protect, authController.restrictTo('vendor'), productController.getAllMyProductItems);

router.route('/myProducts/:id')
        // .get(authController.protect, authController.restrictTo('vendor'), productController.getMyProductItem)
        .patch(authController.protect, authController.restrictTo('vendor'), productController.updateMyProductItem)
        .delete(authController.protect, authController.restrictTo('vendor'), productController.deleteMyProductItem);

router.route('/')
        .post(productController.createProduct)
        .get(productController.getAllProducts);

router.route('/:id')
        .get(productController.getProduct)
        .patch(productController.updateProduct)
        .delete(productController.deleteProduct);


module.exports = router;