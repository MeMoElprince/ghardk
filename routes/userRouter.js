const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
    
router.route('/signup').post(authController.signUp);
router.route('/login').post(authController.login);

router.route('/')
        .post(authController.protect, userController.createUser)
        .get(authController.protect, userController.getAllUsers);

router.route('/:id')
        .get(authController.protect, userController.getUser)
        .patch(authController.protect, userController.updateUser)
        .delete(authController.protect, userController.deleteUser);

module.exports = router;