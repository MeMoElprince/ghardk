const CartProduct = require('../models/cartProductModel');
const ProductItem = require('../models/productItemModel');
const Customer = require('../models/customerModel');
const Cart = require('../models/cartModel');
const db = require('../config/database');
const color = require('../utils/colors');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const ProductImage = require('../models/productImageModel');

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if(allowedFields.includes(el))
            newObj[el] = obj[el];
    });
    return newObj;
};



exports.addProductInMyCart = catchAsync(async (req, res, next) => {
    const customer = await Customer.findOne({
        where: {
            user_id: req.user.id
        }
    });

    const cart = await Cart.findOne({
        where: {
            customer_id: customer.id
        }
    });
    if(!cart) {
        return next(new AppError('Cart not found', 404));
    }
    let cartProduct = await CartProduct.findOne({
        where: {
            cart_id: cart.id,
            product_item_id: req.params.productId
        }
    });
    if(cartProduct) {
        return next(new AppError('Product already in the cart', 400));
    }
    const data = filterObj(req.body, 'quantity');
    data.quantity = data.quantity * 1;
    // console.log(color.FgBlue, req.body.productID, color.Reset);
    const product_item = await ProductItem.findByPk(req.params.productId);
    if(!product_item) {
        return next(new AppError('Product not found', 404));
    }
    data.price = product_item.price * data.quantity;
    data.cart_id = cart.id;
    data.product_item_id = req.params.productId;
    cartProduct = await CartProduct.create(data);
    res.status(201).json({
        status: 'success',
        data: {
            cartProduct
        }
    });
});

exports.deleteProductInMyCart = catchAsync(async (req, res, next) => {
    const cartProduct = await CartProduct.findByPk(req.params.id);
    if(!cartProduct) {
        return next(new AppError('Product not found in the cart', 404));
    }
    await cartProduct.destroy();
    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.updateProductInMyCart = catchAsync(async (req, res, next) => {
    const cartProduct = await CartProduct.findOne({
        where: {
            id: req.params.id
        }
    });
    if(!cartProduct) {
        return next(new AppError('Product not found in the cart', 404));
    }
    const data = filterObj(req.body, 'quantity');
    data.quantity = data.quantity * 1;
    const product_item_id = cartProduct.product_item_id;
    const product_item = await ProductItem.findByPk(product_item_id);
    if(!product_item) {
        return next(new AppError('Product not found', 404));
    }
    if(data.quantity < 1) {
        return next(new AppError('Invalid Quantity', 400));
    }
    if(product_item.quantity < data.quantity)
        return next(new AppError('Vendor can\'t prepare that much of quantity', 400));
    data.price = product_item.price * data.quantity;
    await cartProduct.update(data);
    res.status(200).json({
        status: 'success',
        data: {
            cartProduct
        }
    });
});

exports.getMyCart = catchAsync(async (req, res, next) => {
    const customer = await Customer.findOne({
        where: {
            user_id: req.user.id
        }
    });
    const cart = await Cart.findOne({
        where: {
            customer_id: customer.id
        }
    });
    if(!cart) {
        return next(new AppError('Cart not found', 404));
    }
    let cartProducts = await db.query(
        `
            SELECT 
                cp.id, 
                cp.quantity, 
                cp.price AS total_price, 
                pi.id as product_item_id, 
                p.name, 
                pi.price as product_price, 
                p.description,
                u.first_name as vendor_first_name,
                u.last_name as vendor_last_name,
                u.email as vendor_email,
                cp."createdAt",
                cp."updatedAt"
            FROM 
                cart_products cp
            JOIN 
                product_items pi ON cp.product_item_id = pi.id
            JOIN 
                products p ON pi.product_id = p.id
            JOIN 
                vendors v ON pi.vendor_id = v.id
            JOIN 
                users u ON v.user_id = u.id
            WHERE 
                cp.cart_id = ${cart.id}
        `
    );
    cartProducts = cartProducts[0];
    let checkout_price = 0;
    for(let i = 0; i < cartProducts.length; i++) {
        let productImages = await db.query(
            `
                SELECT
                    i.url AS image_url,
                    i.remote_id AS image_id
                FROM
                    product_images pi
                JOIN
                    images i ON pi.image_id = i.id
                WHERE
                    pi.product_item_id = ${cartProducts[i].product_item_id}
            `
        );
        checkout_price = checkout_price * 1.0 + cartProducts[i].total_price * 1.0;
        productImages = productImages[0];
        cartProducts[i].images = productImages;
    }
    res.status(200).json({
        status: 'success',
        data: {
            count: cartProducts.length,
            checkout_price,
            cartProducts
        }
    });
});

exports.deleteMyCart = catchAsync(async (req, res, next) => {
    const customer = await Customer.findOne({
        where: {
            user_id: req.user.id
        }
    });
    const cart = await Cart.findOne({
        where: {
            customer_id: customer.id
        }
    });
    if(!cart) {
        return next(new AppError('Cart not found', 404));
    }
    await CartProduct.destroy({
        where: {
            cart_id: cart.id
        }
    });
    res.status(204).json({
        status: 'success',
        data: null
    });
});
