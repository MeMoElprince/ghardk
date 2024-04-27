const Variation = require('../models/variationModel');
const VariationOption = require('../models/variationOptionModel');
const catchAsync = require('../utils/catchAsync');
const crudFactory = require('./crudFactory');


exports.getAllVariations = crudFactory.getAll(Variation);
exports.getVariation = crudFactory.getOne(Variation);
exports.createVariation = crudFactory.createOne(Variation, 'name');
exports.updateVariation = crudFactory.updateOne(Variation, 'name');
exports.deleteVariation = catchAsync (async (req, res, next) => {
    const variation = await Variation.findByPk(req.params.id);
    if (!variation) {
        return next(new AppError('No variation found with that ID', 404));
    }
    const options = await VariationOption.findAll({
        where: {
            variation_id: req.params.id
        }
    });
    if(options)
    {
        options.forEach(async (option) => {
            await option.destroy();
        });
    }
    await variation.destroy();
    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.getAllVariationOptions = crudFactory.getAll(VariationOption);
exports.getVariationOption = crudFactory.getOne(VariationOption);
exports.createVariationOption = crudFactory.createOne(VariationOption, 'value', 'variation_id');
exports.updateVariationOption = crudFactory.updateOne(VariationOption, 'name', 'variation_id');
exports.deleteVariationOption = crudFactory.deleteOne(VariationOption);