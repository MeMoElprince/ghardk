const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const productController = require('../controllers/productController');
const cartRouter = require('./cartRouter');
const reviewRouter = require('./reviewRouter');
const productImageRouter = require('./productImageRouter');
const favouriteRouter = require('./favouriteRouter');

router.use('/:productId/images', productImageRouter);
router.use('/:productId/carts/', cartRouter);
router.use('/:productId/reviews', reviewRouter);
router.use('/:productId/favourites', favouriteRouter);
router.route('/myProducts')
        .post(authController.protect, authController.restrictTo('vendor'), productController.createNewProductItem)
        .get(authController.protect, authController.restrictTo('vendor'), productController.getAllMyProductItems);

router.route('/myProducts/:id')
        // .get(authController.protect, authController.restrictTo('vendor'), productController.getMyProductItem)
        .patch(authController.protect, authController.restrictTo('vendor'), productController.updateMyProductItem)
        .delete(authController.protect, authController.restrictTo('vendor'), productController.deleteMyProductItem);



router.route('/for-you')
        .get(authController.isLoggedIn, productController.getForYouProducts);

router.route('/explore')
        .get(authController.isLoggedIn, productController.getExploreProducts);
router.route('/recommendation-text/:text')
        .get(authController.isLoggedIn, productController.getSimilarProductsByText);

router.route('/')
        .post(productController.createProduct)
        .get(productController.getAllProducts);


router.route('/popular')
        .get(authController.isLoggedIn, productController.getPopularProducts);

router.route('/vendors/:vendorId')
        .get(authController.isLoggedIn, productController.getAllProductsByVendor);

router.route('/items/:id')
        .get(authController.isLoggedIn, productController.getProductItem)

router.route('/:id')
        .get(productController.getProduct)
        .patch(productController.updateProduct)
        .delete(productController.deleteProduct);


module.exports = router;