const express = require('express');
const router = express.Router();

const variationController = require('../controllers/variationController');

router.route('/options')
        .get(variationController.getAllVariationOptions)
        .post(variationController.createVariationOption);

router.route('/options/:id')
        .get(variationController.getAllVariationOptions)
        .patch(variationController.updateVariationOption)
        .delete(variationController.deleteVariationOption);

router.route('/')
        .get(variationController.getAllVariations)
        .post(variationController.createVariation);

router.route('/:id')
        .get(variationController.getVariation)
        .patch(variationController.updateVariation)
        .delete(variationController.deleteVariation);


module.exports = router;