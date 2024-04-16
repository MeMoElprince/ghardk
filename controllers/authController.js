const User = require('../models/userModel');
const Vendor = require('../models/vendorModel');
const Customer = require('../models/customerModel');
const Cart = require('../models/cartModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const Email = require('../utils/emailHandler');
const color = require('../utils/colors');

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if(allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
}

exports.signUp = catchAsync(async (req, res, next) => {
    const data = filterObj(req.body, 'first_name', 'last_name', 'email', 'password', 'password_confirm', 'role', 'dob', 'gender');
    if(data.role === 'admin' || !data.role) {
        return next(new AppError('Invalid role value', 401));
    }
    
    
    // hash the password automatically when create or save
    console.log(color.FgCyan, 'Creating user...', color.Reset);
    const user = await User.create(data);
    console.log(color.FgGreen, 'User created successfully.', color.Reset);
    
    if(data.role === 'vendor') {
        const newData = filterObj(req.body, 'national_id');
        newData.user_id = user.id;
        // create vendor
        console.log(color.FgCyan, 'Creating Vendor...', color.Reset);
        let vendor;
        try{
            vendor = await Vendor.create(newData);
            console.log(color.FgGreen, 'Vendor created successfully.', color.Reset);
        } catch (err)
        {
            await user.destroy();
            return next(new AppError('Vendor failed to be created', 400));
        }
    }

    if(data.role === 'customer') {
        const newData = {user_id: user.id};
        // create the customer
        console.log(color.FgCyan, 'Creating Customer...', color.Reset);
        let customer;
        try {
            customer = await Customer.create(newData);
            console.log(color.FgGreen, 'Customer created successfully.', color.Reset);
        } catch (err) {
            await user.destroy();
            return next(new AppError('Customer failed to be created', 400));
        }

        // create cart
        console.log(color.FgCyan, 'Creating Cart...', color.Reset);
        try {
            const cart = await Cart.create({customer_id: customer.id});
            console.log(color.FgGreen, 'Cart created successfully.', color.Reset);
        } catch (err) {
            await customer.destroy();
            await user.destroy();
            return next(new AppError('Cart failed to be created', 400));
        }
    }
    // Create Token
    // ,,,,,,,,,,,,

    // create a secret token 
    const secret_token = user.createSecretToken();
    await user.save();
    console.log(color.FgRed, `Secret token: ${secret_token}`, color.Reset);


    // send email to user with verification link
    await new Email(user, secret_token).verifyAccount();
    console.log(color.FgMagenta, 'Verification email sent successfully.', color.Reset);

    res.status(201).json({
        status: 'success',
        data: {
            user
        }
    })
});
