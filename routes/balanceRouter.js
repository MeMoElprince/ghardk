const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');

const balanceController = require('../controllers/balanceController');

router.route('/me')
        .get(authController.protect, authController.restrictTo('vendor'), balanceController.getBalance);

module.exports = router;