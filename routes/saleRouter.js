const express = require('express');
const router = express.Router();


const saleController = require('../controllers/saleController');
const authController = require('../controllers/authController');


router.route('/checkout')
            .post(authController.protect, authController.restrictTo('customer'), saleController.checkout);

router.route('/checkout-callback')
            .post(saleController.checkoutCallback);

module.exports = router;