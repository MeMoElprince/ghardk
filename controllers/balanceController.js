const Balance = require('../models/balanceModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const color = require('../utils/colors');
const Vendor = require('../models/vendorModel');

// const filterObj = (obj, ...allowedFields) => {
//     const newObj = {};
//     Object.keys(obj).forEach(el => {
//         if(allowedFields.includes(el)) newObj[el] = obj[el];
//     });
//     return newObj;
// }

exports.getBalance = catchAsync(async (req, res, next) => {
    const vendor = await Vendor.findOne({
        where: {
            user_id: req.user.id
        }
    });
    const vendor_id = vendor.id;
    const balance = await Balance.findOne({
        where: {
            vendor_id
        } 
    });
    if(!balance) {
        return next(new AppError('Balance not found', 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            balance
        }
    });
});