const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const color = require('../utils/colors');
const Category = require('../models/categoryModel');
const crudFactory = require('./crudFactory');


exports.createCategory = crudFactory.createOne(Category, 'name', 'parent_category_id');
exports.getAllCategories = crudFactory.getAll(Category);
exports.getCategory = crudFactory.getOne(Category);
exports.updateCategory = crudFactory.updateOne(Category, 'name', 'parent_category_id');
exports.deleteCategory = crudFactory.deleteOne(Category);


