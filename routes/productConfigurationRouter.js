const express = require('express');
const router = express.Router({mergeParams: true});

const productConfigurationController = require('../controllers/productConfigurationController');


// vendor wants to create his product configuration for a product item   he needs : 
// product id, variation option id


// user wants to get the product configuration

// 


router.route('/')
        .get(productConfigurationController.getAllConfigurationsByProduct);

router.route('/')
        .get(productConfigurationController.getAllProductConfigurations)
        .post(productConfigurationController.createProductConfiguration);

router.route('/:id')
        .patch(productConfigurationController.updateProductConfiguration)
        .delete(productConfigurationController.deleteProductConfiguration);

module.exports = router;