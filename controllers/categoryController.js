const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const color = require('../utils/colors');
const Category = require('../models/categoryModel');

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if(allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
}

exports.createCategory = catchAsync(async (req, res, next) => {
    const data = filterObj(req.body, 'name', 'parent_category_id');
    const category = await Category.create(data);
    res.status(201).json({
        status: 'success',
        data: {
            category
        }
    });
});


exports.getAllCategories = catchAsync(async (req, res, next) => {
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 10;
    const offset = (page - 1) * limit;
    const categories = await Category.findAll({
        limit,
        offset
    });
    res.status(200).json({
        status: 'success',
        data: {
            categories
        }
    });
});