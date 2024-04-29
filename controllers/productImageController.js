const productImage = require('../models/productImageModel');
const ProductItem = require('../models/productItemModel');
const Vendor = require('../models/vendorModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const color = require('../utils/colors');

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
}



