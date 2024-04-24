const express = require('express');
const router = express.Router();

const addressController = require('../controllers/addressController');
const authController = require('../controllers/authController');

router.route('/defaultAddress')
        .get(authController.protect, addressController.getDefaultAddress);

router.route('/')
        .post(authController.protect, addressController.createAddress)
        .get(authController.protect, addressController.getAllAddresses);

router.route('/:id')
        .patch(authController.protect, addressController.updateAddress)
        .delete(authController.protect, addressController.deleteAddress);

module.exports = router;