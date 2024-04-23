const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/categoryController');
const authController = require('../controllers/authController');


router.route('/')
        .post(categoryController.createCategory)
        .get(categoryController.getAllCategories);

router.route('/:id')
        .get(categoryController.getCategory)
        .patch(categoryController.updateCategory)
        .delete(categoryController.deleteCategory);


module.exports = router;