const Product = require('../models/productModel');
const color = require('../utils/colors');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');


const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if(allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
}

exports.createProduct = catchAsync(async (req, res, next) => {
    const data = filterObj(req.body, 'name', 'description', 'category_id');
    const product = await Product.create(data);
    res.status(201).json({
        status: 'success',
        data: {
            product
        }
    });
});


exports.getAllProducts = catchAsync(async (req, res, next) => {
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 10;
    const offset = (page - 1) * limit;
    const products = await Product.findAll({
        limit,
        offset
    });
    res.status(200).json({
        status: 'success',
        data: {
            products
        }
    });
});