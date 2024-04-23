const Product = require('../models/productModel');
const color = require('../utils/colors');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const crudFactory = require('./crudFactory');

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if(allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
}

exports.createProduct = crudFactory.createOne(Product, 'name', 'description', 'category_id');
exports.getAllProducts = crudFactory.getAll(Product);
exports.getProduct = crudFactory.getOne(Product);
exports.updateProduct = crudFactory.updateOne(Product, 'name', 'description', 'category_id');
exports.deleteProduct = crudFactory.deleteOne(Product);
