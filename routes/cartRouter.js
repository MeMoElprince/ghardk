const express = require('express');
const router = express.Router({mergeParams: true});

const authController = require('../controllers/authController');
const cartController = require('../controllers/cartController');



router.route('/item')
        .post(authController.protect, authController.restrictTo('customer'), cartController.addProductInMyCart);

router.route('/')
        .get(authController.protect, authController.restrictTo('customer'), cartController.getMyCart)
        .delete(authController.protect, authController.restrictTo('customer'), cartController.deleteMyCart);

router.route('/:id')
        .delete(authController.protect, authController.restrictTo('customer'), cartController.deleteProductInMyCart)
        .patch(authController.protect, authController.restrictTo('customer'), cartController.updateProductInMyCart);

module.exports = router;