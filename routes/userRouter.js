const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
    
router.route('/signup').post(authController.uploadImage, authController.uploadToImageKit, authController.signUp);
router.route('/login').post(authController.login);
router.route('/verify').post(authController.verifyAccount);
router.route('/forget-password').post(authController.forgetPassword);
router.route('/reset-token').post(authController.resetToken);
router.route('/reset-password').post(authController.resetPassword);
router.route('/verify-token').post(authController.sendVerificationEmail);


router.get('/getMe', authController.protect, userController.getMe);
router.patch('/updateMe', authController.protect, authController.uploadImage, authController.uploadToImageKit, userController.updateMe);

router.route('/change-password')
        .patch(authController.protect, authController.changePassword);

router.route('/top-rated-sellers')
        .get(userController.getTopRatedVendors);

router.route('/')
        .get(userController.getAllUsers)
        .post(authController.protect, authController.restrictTo('admin'), userController.createUser);

router.route('/:id')
        .get(userController.getUser)
        .patch(authController.protect, authController.restrictTo('admin'), userController.updateUser)
        .delete(authController.protect, authController.restrictTo('admin'), userController.deleteUser);

module.exports = router;