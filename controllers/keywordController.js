const Keyword = require('../models/keywordModel');
const ProductItem = require('../models/productItemModel');
const Vendor = require('../models/vendorModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const color = require('../utils/colors');
const crudFactory = require('./crudFactory');


const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
}

exports.createProductKeyword = catchAsync(async (req, res, next) => {
    const data = filterObj(req.body, 'product_item_id', 'name');
    const vendor = await Vendor.findOne({
        where: {
            user_id: req.user.id
        }
    });
    if(!vendor) {
        return next(new AppError('No vendor found with that ID', 404));
    }
    const productItem = await ProductItem.findOne({
        where: {
            id: data.product_item_id,
            vendor_id: vendor.id
        }
    });
    if (!productItem) {
        return next(new AppError('No such a product item for you', 404));
    }
    const keyword = await Keyword.create(data);
    res.status(201).json({
        status: 'success',
        data: {
            keyword
        }
    });
});

exports.getAllProductKeywords = catchAsync(async (req, res, next) => { 
    const data = filterObj(req.body, 'product_item_id');
    const keywords = await Keyword.findAll({
        where: {
            product_item_id: data.product_item_id
        }
    });
    res.status(200).json({
        status: 'success',
        data: {
            keywords
        }
    });
});

exports.deleteProductKeyword = catchAsync(async (req, res, next) => {
    const vendor = await Vendor.findOne({
        where: {
            user_id: req.user.id
        }
    });
    if(!vendor) {
        return next(new AppError('No vendor found with that ID', 404));
    }
    const keyword = await Keyword.findOne({
        where: {
            id: req.params.id
        }
    });
    if (!keyword) {
        return next(new AppError('No such a keyword for you', 404));
    }
    const productItem = await ProductItem.findOne({
        where: {
            id: keyword.product_item_id,
            vendor_id: vendor.id
        }
    });
    if (!productItem) {
        return next(new AppError('No such a product item for you', 404));
    }
    await keyword.destroy();
    res.status(204).json({
        status: 'success',
        data: null
    });
});