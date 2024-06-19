const Review = require('../models/reviewModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const crudFactory = require('./crudFactory');
const Customer = require('../models/customerModel');

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

    const reviews = await Review.findAll({
        where: {
            // 
            product_item_id: itemId,
            status: 'approved'
        }
    });
    // populate customer don't forget
    return res.status(200).json({
        status: "success",
        reviews
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
    const review = await Review.findOne({
        where: {
            id: req.params.id,
            status: 'pending'
        }
    });
    if(!review) {
        return next(new AppError('Invalid review', 404));
    }
    const customer = await Customer.findOne({
        where: {
            user_id: req.user.id
        }
    })
    if(!customer) {
        return next(new AppError('You must be a customer to review a product', 401));
    }
    if(review.customer_id !== customer.id) {
        return next(new AppError('You are not allowed to review this product', 401));
    }
    if(!data.rating) {
        return next(new AppError('Rating is required', 400));
    }
    review.rating = data.rating;
    if(data.comment) {
        review.comment = data.comment;
    }
    review.status = 'approved';
    await review.save();
    return res.status(201).json({
        status: 'success',
        data: {
            review
        }
    });
});

exports.rejectReview = catchAsync(async (req, res, next) => {
    const customer = await Customer.fineOne({
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

