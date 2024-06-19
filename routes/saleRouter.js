const express = require('express');
const router = express.Router();


const saleController = require('../controllers/saleController');
const authController = require('../controllers/authController');


router.route('/checkout')
            .patch(authController.protect, authController.restrictTo('customer'), saleController.checkout);

router.route('/checkout-callback')
            .post(saleController.checkoutCallback);


router.route('/:id/cancel-sale')
            .patch(authController.protect, authController.restrictTo('vendor', 'admin'), saleController.cancelSale);


module.exports = router;