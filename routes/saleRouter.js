const express = require('express');
const router = express.Router();


const saleController = require('../controllers/saleController');
const authController = require('../controllers/authController');


router.route('/')
        .get(authController.protect, authController.restrictTo('customer', 'vendor'), saleController.getAllMySales);
router.route('/pending')
        .get(authController.protect, authController.restrictTo('customer', 'vendor'), saleController.getMyPendingSales);

router.route('/checkout')
            .patch(authController.protect, authController.restrictTo('customer'), saleController.checkout);

router.route('/checkout-callback')
            .post(saleController.checkoutCallback);


router.route('/:id')
        .get(authController.protect, authController.restrictTo('customer', 'vendor'), saleController.getSale);

router.route('/:id/cancel-sale')
            .patch(authController.protect, saleController.cancelSale);

router.route('/:id/confirm-sale')
            .patch(authController.protect, authController.restrictTo('admin'), saleController.confirmSale);
module.exports = router;