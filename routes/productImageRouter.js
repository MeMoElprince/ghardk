const express = require('expres');
const router = express.Router();

const productController = require('../controllers/productController');
const authController = require('../controllers/authController');

router.route('/')
        .get(productController.getAllProductImages)
        .post(authController.protect, authController.restrictTo('vendor'), productController.createProductImage);

router.delete('/:id', authController.protect, authController.restrictTo('vendor'), productController.deleteProductImage);



module.exports = router;