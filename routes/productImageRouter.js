const express = require('express');
const router = express.Router({mergeParams: true});

const productController = require('../controllers/productController');
const authController = require('../controllers/authController');

router.route('/')
        .post(authController.protect, authController.restrictTo('vendor'), productController.uploadProductImage, productController.uploadProductImageToImageKit, productController.createProductImages);

router.delete('/:id', authController.protect, authController.restrictTo('vendor'), productController.deleteProductImage);



module.exports = router;