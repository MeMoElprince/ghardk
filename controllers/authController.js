const User = require('../models/userModel');
const Vendor = require('../models/vendorModel');
const Customer = require('../models/customerModel');
const Cart = require('../models/cartModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const Email = require('../utils/emailHandler');
const color = require('../utils/colors');
const tokenFactory = require('../utils/tokenFactory');
const Balance = require('../models/balanceModel');


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

        // create balance
        console.log(color.FgCyan, 'Creating Balance...', color.Reset);
        let balance;
        try{
            balance = await Balance.create({vendor_id: vendor.id});
            console.log(color.FgGreen, 'Balance created successfully.', color.Reset);
        } catch (err)
        {
            await vendor.destroy();
            await user.destroy();
            return next(new AppError('Balance failed to be created', 400));
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
    const token = tokenFactory.sign({id: user.id});

    // create a secret token 
    const secret_token = user.createSecretToken();
    await user.save();
    console.log(color.FgRed, `Secret token: ${secret_token}`, color.Reset);


    // send email to user with verification link
    if(process.env.NODE_ENV === 'production')
    {
        await new Email(user, secret_token).verifyAccount();
        console.log(color.FgMagenta, 'Verification email sent successfully.', color.Reset);
    }

    const result = {...user.toJSON(), token};
    res.status(201).json({
        status: 'success',
        data: {
            user: result
        }
    })
});

exports.login = catchAsync(async (req, res, next) => {
    const data = filterObj(req.body, 'email', 'password');
    if(!data.password || !data.email)
        return next(new AppError('You must provide an email and password together!', 400));
    const user = await User.findOne({
        where: {
            email: data.email
        }
    });
    if(!user || !await user.validatePassword(data.password))
        return next(new AppError('Email or password isn\'t correct...', 401)); 
    const token = tokenFactory.sign({id: user.id});
    res.status(200).json({
        status: "success",
        data: {
            token
        }
    });
});

exports.protect = catchAsync(async (req, res, next) => {
    // getting token and check if it exists
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer'))
        token = req.headers.authorization.split(' ')[1];
    if(!token)
        return next(new AppError('No token found!!', 401));
    // verification token
    const decoded = await tokenFactory.verify(token);
    // check if user still exists
    const currentUser = await User.findByPk(decoded.id);
    if(!currentUser)
        return next(new AppError('User doesn\'t exist!!', 401));
    // check if user changed password after the token was issued
    // if(currentUser.changed_password_at(decoded.iat))
    //     return next(new AppError('قام المستخدم مؤخرًا بتغيير كلمة المرور! الرجاد الدخول على الحساب من جديد.', 401));
    // grant access to protected route
    if(!currentUser.active)
        return next(new AppError('You havn\'t verified your account yet!!', 401));
    
    req.user = currentUser;
    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if(!roles.includes(req.user.role))
            return next(new AppError('You don\'t have permission to perform this action', 403));
        next();
    }
}