const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const coutryController = require('../controllers/countryController');

router.route('/')
        .post(coutryController.createCountry)
        .get(coutryController.getAllCountries);

router.route('/:id')
        .get(coutryController.getCountry)
        .patch(coutryController.updateCountry)
        .delete(coutryController.deleteCountry);


module.exports = router;