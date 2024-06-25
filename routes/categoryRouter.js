const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/categoryController');
const authController = require('../controllers/authController');


router.route('/')
        .post(authController.uploadImage, authController.uploadToImageKit, categoryController.createCategory)
        .get(categoryController.getAllCategories);

router.route('/:id')
        .get(categoryController.getCategory)
        .patch(authController.uploadImage, authController.uploadToImageKit, categoryController.updateCategory)
        .delete(categoryController.deleteCategory);


module.exports = router;