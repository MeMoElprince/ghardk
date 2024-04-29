const express = require('express');
const router = express.Router();

const keywordController = require('../controllers/keywordController');
const authController = require('../controllers/authController');

// i will send the product_item_id  in the body of the request to create the keywords for that product item 
router.route('/')
        .get(keywordController.getAllProductKeywords)
        .post(authController.protect, authController.restrictTo('vendor'), keywordController.createProductKeyword);

router.route('/:id')
        .delete(authController.protect, authController.restrictTo('vendor'), keywordController.deleteProductKeyword);

module.exports = router;