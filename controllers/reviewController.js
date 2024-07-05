const Review = require('../models/reviewModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const crudFactory = require('./crudFactory');
const Customer = require('../models/customerModel');
const db = require('../config/database');
const Vendor = require('../models/vendorModel');
const ProductItem = require('../models/productItemModel');
const color = require('../utils/colors');
// customer get this review 


const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if(allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};


exports.isValidReview = catchAsync(async (req, res, next) => {
    const review = await Review.findOne({
        where: {
            id: req.params.id
        }
    });
    if(!review)
        return next(new AppError('Review not found', 404));
    let result = false;
    if(review.status === 'pending')
        result = true;
    res.status(200).json({
        status: "success",
        result
    });
});

exports.getProductReviews = catchAsync(async (req, res, next) => {
    console.log(req.params);
    const itemId = req.params.productId;
    if(!itemId)
        return next(new AppError('You must provide an ID of product item', 400));

    let reviews = await db.query(
        `
            SELECT 
                r.id,
                r.rating,
                r.comment,
                r.status,
                r."createdAt",
                r."updatedAt",
                u.first_name as customer_first_name,
                u.last_name as customer_last_name,
                u.email as customer_email,
                i.url as customer_image_url,
                i.remote_id as customer_image_id
            FROM
                reviews r
            JOIN
                customers c ON r.customer_id = c.id
            JOIN
                users u ON c.user_id = u.id
            JOIN
                images i ON u.image_id = i.id
            WHERE
                r.product_item_id = ${itemId} AND r.status = 'approved'
        `
    );  
    reviews = reviews[0];
    // populate customer don't forget
    return res.status(200).json({
        status: "success",
        data: {
            count: reviews.length,
            reviews
        }
    });
    
});

exports.getMyReviews = catchAsync(async (req, res, next) => {
    const customer = await Customer.findOne({
        where: {
            user_id: req.user.id
        }
    });
    if(!customer)
        return next(new AppError('You are not a customer', 400));
    const reviews = await Review.findAll({
        where: {
            customer_id: customer.id,
            status: 'approved'
        }
    })
    return res.status(200).json({
        status: "success",
        reviews
    });
});



exports.createReview = catchAsync(async (req, res, next) => {
    const data = filterObj(req.body, 'rating', 'comment');
    // const customer 
    const customer = await Customer.findOne({
        where: {
            user_id: req.user.id
        }
    })
    if(!customer) {
        return next(new AppError('You must be a customer to review a product', 401));
    }
    const review = await Review.findOne({
        where: {
            product_item_id: req.params.id,
            customer_id: customer.id
        }
    });
    if(!review) {
        return next(new AppError('Invalid review', 404));
    }
    if(review.status !== 'pending') {
        return next(new AppError('You have already reviewed this product', 400));
    }
    if(review.customer_id !== customer.id) {
        return next(new AppError('You are not allowed to review this product', 401));
    }
    if(!data.rating) {
        return next(new AppError('Rating is required', 400));
    }
    if(data.rating < 1 || data.rating > 5) {
        return next(new AppError('Rating must be between 1 and 5', 400));
    }
    review.rating = data.rating;
    if(data.comment) {
        review.comment = data.comment;
    }
    review.status = 'approved';
    await review.save();
    
    // update rating and rating_count in product item
    const productItem = await ProductItem.findOne({
        where: {
            id: review.product_item_id
        }
    });
    if(!productItem) {
        return next(new AppError('Product item not found', 404));
    }
    productItem.rating = (productItem.rating *1.0 * productItem.rating_count*1.0 + review.rating * 1.0) / (productItem.rating_count * 1.0 + 1);
    productItem.rating_count = productItem.rating_count * 1 + 1;
    await productItem.save();
    const vendor = await Vendor.findOne({
        where: {
            id: productItem.vendor_id
        }
    });

    if(!vendor) {
        return next(new AppError('Vendor not found', 404));
    }
    vendor.rating = (vendor.rating * 1.0 * vendor.rating_count * 1.0 + review.rating * 1.0) / (vendor.rating_count * 1.0 + 1);
    vendor.rating_count = vendor.rating_count * 1 + 1;
    await vendor.save();
    return res.status(201).json({
        status: 'success',
        data: {
            review
        }
    });
});

exports.rejectReview = catchAsync(async (req, res, next) => {
    const customer = await Customer.findOne({
        where: {
            user_id: req.user.id
        }
    });
    const review = await Review.findOne({
        where: {
            id: req.params.id,
            status: 'pending',
            customer_id: customer.id
        }
    });
    if(!review) {
        return next(new AppError('Invalid review', 404));
    }
    review.status = 'rejected';
    await review.save();
    return res.status(204).json({
        status: 'success',
        data: null
    });
});

