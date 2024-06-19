const express = require('express');
const router = express.Router({mergeParams: true});

const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');



router.route('/')
        .get(reviewController.getProductReviews);
router.route('/get-my-reviews')
        .get(authController.protect, authController.restrictTo('customer'), reviewController.getMyReviews);

router.route('/is-vaild-review/:id')
        .get(authController.protect, reviewController.isValidReview);

router.route('/approve-review/:id')
        .patch(authController.protect, authController.restrictTo('customer'), reviewController.createReview);
router.route('/reject-review/:id')
        .patch(authController.protect, authController.restrictTo('customer'), reviewController.rejectReview);


module.exports = router;