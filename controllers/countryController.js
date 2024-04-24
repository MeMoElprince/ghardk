const Country = require('../models/countryModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const color = require('../utils/colors');
const crudFactory = require('./crudFactory');

exports.getAllCountries = crudFactory.getAll(Country);
exports.createCountry = crudFactory.createOne(Country, 'name', 'code');
exports.getCountry = crudFactory.getOne(Country);
exports.updateCountry = crudFactory.updateOne(Country, 'name', 'code');
exports.deleteCountry = crudFactory.deleteOne(Country);
