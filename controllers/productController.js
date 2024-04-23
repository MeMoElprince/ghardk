const Product = require('../models/productModel');
const ProductItem = require('../models/productItemModel');
const Vendor = require('../models/vendorModel');
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


exports.createNewProduct = catchAsync(async (req, res, next) => {
    let data = filterObj(req.body, 'name', 'description', 'category_id');
    const newProduct = await Product.create(data);

    const vendor = await Vendor.findOne({where: {user_id: req.user.id}});
    if(!vendorId) {
        await newProduct.destroy();
        return next(new AppError('Vendor not found', 404));
    } 
    data = filterObj(req.body, 'price', 'quantity');
    data.vendor_id = vendor.id;
    data.product_id = newProduct.id;
    let productItem;
    try{
        productItem = await ProductItem.create(data);
    } catch(err){
        await newProduct.destroy();
        return next(new AppError(`Product Item could not be created, ${err.message}`, 500));
    }
    res.status(201).json({
        status: 'success',
        data: {
            productItem
        }
    });
});
// Not Completed
exports.getAllMyProducts = catchAsync(async (req, res, next) => {
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 10;
    const offset = (page - 1) * limit;
    const vendor = await Vendor.findOne({where: {user_id: req.user.id}});
    if(!vendor) {
        return next(new AppError('Vendor not found', 404));
    }
    const productItems = await ProductItem.findAll({
        where: {
            vendor_id: vendor.id
        },
        limit,
        offset,
    });
    res.status(200).json({
        status: 'success',
        data: {
            count: productItems.length,
            productItems
        }
    });
});
// Not Completed
exports.updateMyProduct = catchAsync(async (req, res, next) => {
    let data = filterObj(req.body, 'price', 'quantity');
    const productItem = await ProductItem.findByPk(req.params.id);
    if(!productItem) {
        return next(new AppError('Product Item not found', 404));
    }
    if(data.price || data.quantity) {
        await productItem.update(data);
    }
    data = filterObj(req.body, 'name', 'description', 'category_id');
    if(data.name || data.description || data.category_id) {
        const product = await Product.findByPk(productItem.product_id);
        if(!product) {
            return next(new AppError('Product not found', 404));
        }
        await product.update(data);
        productItem.product_id = product;
    }
    res.status(200).json({
        status: 'success',
        data: {
            productItem
        }
    });
});

exports.deleteMyProduct = catchAsync(async (req, res, next) => {
    const productItem = await ProductItem.findByPk(req.params.id);
    if(!productItem) {
        return next(new AppError('Product Item not found', 404));
    }
    const product = await Product.findByPk(productItem.product_id);
    if(!product) {
        await productItem.destroy();
        return res.status(204).json({
            status: 'success',
            data: null
        });
    }
    await productItem.destroy();
    await product.destroy();
    res.status(204).json({
        status: 'success',
        data: null
    });
});