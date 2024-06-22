const FavouriteProduct = require('../models/favouriteProductModel');
const Customer = require('../models/customerModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const ProductItem = require('../models/productItemModel');
const db = require('../config/database');
const ProductImages = require('../models/productImageModel');


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
    const favouriteProductTest = await FavouriteProduct.findOne({
        where: {
            customer_id: customer.id,
            product_item_id: data.product_item_id
        }
    })
    // we can replace the below if condition with setting 2 columns as a primary key in db
    if(favouriteProductTest)
        return next(new AppError('Product already in favourite', 400));
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
    // const favouriteProducts = await FavouriteProduct.findAll({
    //     where: {
    //         customer_id: customer_id
    //     }
    // });

    // query with sql language
    let favouriteProducts = await db.query(
        `
            SELECT product_items.id, products.name, products.description, product_items.product_id, product_items.vendor_id, product_items.quantity, product_items.price 
            FROM favourite_products 
            JOIN product_items ON favourite_products.product_item_id = product_items.id
            JOIN products ON product_items.product_id = products.id
            WHERE customer_id = ${customer_id}
        `
    );
    favouriteProducts = favouriteProducts[0];
    for(let i = 0; i < favouriteProducts.length; i++) {
        const productImages = await db.query(
            `
                Select images.url as image_url, images.remote_id as image_id 
                FROM product_images
                JOIN images ON product_images.image_id = images.id
                WHERE product_item_id = ${favouriteProducts[i].id}
            `
        );
        console.log(productImages[0]);
        favouriteProducts[i].images = productImages[0];
    }

    res.status(200).json({
        status: 'success',
        data: favouriteProducts
    });
});

exports.deleteFavouriteProduct = catchAsync(async (req, res, next) => {
    // show related product_item_id
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