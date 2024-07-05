const express = require('express');
const router = express.Router();


const notificationController = require('../controllers/notificationController');
const authController = require('../controllers/authController');


router.route('/my-notifications')
        .get(authController.protect, notificationController.getMyNotifications);

router.route('/:id')
        .patch(authController.protect, notificationController.getNotification);



module.exports = router;