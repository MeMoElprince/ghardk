const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');

const favouriteProductController = require('../controllers/favouriteProductController');

// me and i should be a customer
router.route('/')
        .get(authController.protect, authController.restrictTo('customer'), favouriteProductController.getAllFavouriteProducts)
        .post(authController.protect, authController.restrictTo('customer'), favouriteProductController.addProductToFavourite);

// me and i should be a customer and i shoud added this product to my favourite
router.route('/:id')
        .delete(authController.protect, authController.restrictTo('customer'), favouriteProductController.deleteFavouriteProduct);

module.exports = router;