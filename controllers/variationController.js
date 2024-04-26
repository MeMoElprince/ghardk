const Variation = require('../models/variationModel');
const VariationOption = require('../models/variationOptionModel');
const crudFactory = require('./crudFactory');


exports.getAllVariations = crudFactory.getAll(Variation);
exports.getVariation = crudFactory.getOne(Variation);
exports.createVariation = crudFactory.createOne(Variation, 'name');
exports.updateVariation = crudFactory.updateOne(Variation, 'name');
exports.deleteVariation = crudFactory.deleteOne(Variation);

exports.getAllVariationOptions = crudFactory.getAll(VariationOption);
exports.getVariation = crudFactory.getOne(VariationOption);
exports.createVariationOption = crudFactory.createOne(VariationOption, 'name');
exports.updateVariationOption = crudFactory.updateOne(VariationOption, 'name');
exports.deleteVariationOption = crudFactory.deleteOne(VariationOption);