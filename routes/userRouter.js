const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
    
router.route('/signup').post(authController.signUp);
router.route('/login').post(authController.login);

router.route('/')
        .post(authController.protect, authController.restrictTo('admin'), userController.createUser)
        .get(authController.protect, authController.restrictTo('admin'), userController.getAllUsers);

router.route('/:id')
        .get(authController.protect, userController.getUser)
        .patch(authController.protect, authController.restrictTo('admin'), userController.updateUser)
        .delete(authController.protect, authController.restrictTo('admin'), userController.deleteUser);

module.exports = router;