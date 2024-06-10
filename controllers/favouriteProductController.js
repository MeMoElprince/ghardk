const FavouriteProduct = require('../models/favouriteProductModel');
const Customer = require('../models/customerModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if(allowedFields.includes(el))
            newObj[el] = obj[el];
    });
    return newObj;
}

exports.addProductToFavourite = catchAsync(async (req, res, next) => {
    const data = filterObj(req.body, 'product_item_id');
    data.user_id = req.user.id;
    const customer = await Customer.findOne({
        where: {
            user_id: req.user.id
        }
    });
    data.customer_id = customer.id;
    const favouriteProduct = await FavouriteProduct.create(data);
    res.status(201).json({
        status: 'success',
        data: {
            favouriteProduct
        }
    });
});

exports.getAllFavouriteProducts = catchAsync(async (req, res, next) => {
    const customer = await Customer.findOne({
        where: {
            user_id: req.user.id
        }
    });
    const customer_id = customer.id;
    const favouriteProducts = await FavouriteProduct.findAll({
        where: {
            customer_id: customer_id
        }
    });
    res.status(200).json({
        status: 'success',
        data: {
            favouriteProducts
        }
    });
});

exports.deleteFavouriteProduct = catchAsync(async (req, res, next) => {
    const favouriteProduct = await FavouriteProduct.findOne({
        where: {
            id: req.params.id
        }
    });
    if(!favouriteProduct) {
        return next(new AppError('Product not found in favourite', 404));
    }
    await favouriteProduct.destroy();
    res.status(204).json({
        status: 'success',
        data: null
    });
});