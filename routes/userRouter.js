const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
    
router.route('/signup').post(authController.signUp);
router.route('/login').post(authController.login);

router.get('/getMe', authController.protect, userController.getMe);

router.route('/')
        .post(userController.createUser)
        .get(userController.getAllUsers);

router.route('/:id')
        .get(authController.protect, userController.getUser)
        .patch(userController.updateUser)
        .delete(userController.deleteUser);

module.exports = router;