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
const {imageUpload} = require('../utils/multer');
const imageKit = require('imagekit');
const Image = require('../models/imageModel');
const Sequelize = require('sequelize');
const crypto = require('crypto');



const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if(allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
}


const imageKitConfig = new imageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

exports.uploadImage = imageUpload.single('image');

exports.uploadToImageKit = catchAsync(async (req, res, next) => {
    if(!req.file)
        return next();
    req.body.image = req.file;
    next();
});

exports.signUp = catchAsync(async (req, res, next) => {
    const data = filterObj(req.body, 'first_name', 'last_name', 'email', 'password', 'password_confirm', 'role', 'dob', 'gender', 'user_name');
    if(data.role === 'admin' || !data.role) {
        return next(new AppError('Invalid role value', 401));
    }
    // hash the password automatically when create or save
    let local = true;
    let image, newImage;
    if(req.body.image)
    {
        console.log('tryingggg image');
        image = await imageKitConfig.upload({
            file: req.body.image.buffer.toString('base64'),
            fileName: req.body.image.originalname,
            folder: '/users'
        });
        newImage = await Image.create({
            url: image.url,
            remote_id: image.fileId
        });
        data.image_id = newImage.id;  
        local = false;
    }
    else
    {
        newImage = await Image.create({
            url: 'https://ik.imagekit.io/nyep6gibl/default.jpg?updatedAt=1718367419170',
        });
        local = true;
    }
    data.image_id = newImage.id;
    console.log(color.FgCyan, 'Creating user...', color.Reset);
    let user;
    try {
        user = await User.create(data);
    } catch (err) {
        console.log(color.FgRed, 'Removing image...', color.Reset);
        if(newImage)
            await newImage.destroy();
        if(!local)
            await imageKitConfig.deleteFile(image.fileId);
        throw err;
        return next(new AppError(`User failed to be created ${err.message}`, 400));
    }
    console.log(color.FgGreen, 'User created successfully.', color.Reset);
    if(data.role === 'vendor') {
        const newData = filterObj(req.body, 'national_id', 'description');
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
            if(newImage)
                await newImage.destroy();
            if(!local)
                await imageKitConfig.deleteFile(image.fileId);
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
            if(newImage)
                await newImage.destroy();
            if(!local)
                await imageKitConfig.deleteFile(image.fileId);
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
            if(newImage)
                await newImage.destroy();
            if(!local)
                await imageKitConfig.deleteFile(image.fileId);
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
            if(newImage)
                await newImage.destroy();
            if(!local)
                await imageKitConfig.deleteFile(image.fileId);
            return next(new AppError('Cart failed to be created', 400));
        }
    }
    // Create Token
    const token = tokenFactory.sign({id: user.id});

    // create a secret token 
    const secret_token = user.createSecretToken();
    await user.save();
    if(process.env.NODE_ENV !== 'production')
        console.log(color.FgRed, `Secret token: ${secret_token}`, color.Reset);


    // send email to user with verification link
    if(process.env.NODE_ENV === 'production')
    {
        try {
            await new Email(user, secret_token).verifyAccount();
            console.log(color.FgMagenta, 'Verification email sent successfully.', color.Reset);
        } catch (err) {
            user.secret_token = null;
            user.secret_token_expires_at = null;
            return next(new AppError('You have signedup successfully, But there was an error sending the email code verification. ask for code later!!', 500));
        }
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
    const data = filterObj(req.body, 'email', 'password', 'role');

    if(!data.password || !data.email)
        return next(new AppError('You must provide an email and password together!', 400));
    const user = await User.findOne({
        where: {
            email: data.email
        }
    });

    if(data.role)
    {
        if(user.role !== data.role)   
            return next(new AppError('You have no rights to login', 401));
    }

    if(!user || !await user.validatePassword(data.password))
        return next(new AppError('Email or password isn\'t correct...', 401)); 

    const token = tokenFactory.sign({id: user.id});
    res.status(200).json({
        status: "success",
        data: {
            active: user.active,
            token
        }
    });
});

exports.sendVerificationEmail = catchAsync(async (req, res, next) => {
    const email = req.body.email;
    const user = await User.findOne({
        where: {
            email
        }
    });
    if(!user)
        return next(new AppError('User not found!!', 404));
    if(user.active)
        return next(new AppError('User already active!!', 400));
    const secret_token = user.createSecretToken();
    await user.save();
    if(process.env.NODE_ENV === 'production')
    {
        try {
            await new Email(user, secret_token).verifyAccount();
            console.log(color.FgMagenta, 'Verification email sent successfully.', color.Reset);
        } catch (err) {
            user.secret_token = null;
            user.secret_token_expires_at = null;
            return next(new AppError('There was an error sending the email code verification. ask for code later!!', 500));
        }
    }
    else
    {
        console.log(color.FgMagenta, `Secret token: ${secret_token}`, color.Reset);
    }
    res.status(200).json({
        status: 'success',
        message: 'Verification email sent successfully.'
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
    // convert the password changed at to milliseconds 
    const passwordChangedAt = new Date(currentUser.password_changed_at).getTime() / 1000;
    if(passwordChangedAt > decoded.iat)
        return next(new AppError('User recently changed password. Please login again!!', 401));

    if(!currentUser.active)
        return next(new AppError('You havn\'t verified your account yet!!', 401));
    
    req.user = currentUser;
    next();
});

exports.isLoggedIn = catchAsync(async (req, res, next) =>{
    try{
        let token;
        if(req.headers.authorization && req.headers.authorization.startsWith('Bearer'))
            token = req.headers.authorization.split(' ')[1];
        if(!token)
            return next();
        // verification token
        const decoded = await tokenFactory.verify(token);
        // check if user still exists
        const currentUser = await User.findByPk(decoded.id);
        if(!currentUser)
            return next();
        // check if user changed password after the token was issued
        // convert the password changed at to milliseconds 
        const passwordChangedAt = new Date(currentUser.password_changed_at).getTime() / 1000;
        if(passwordChangedAt > decoded.iat)
            return next();
        if(!currentUser.active)
            return next();
        req.user = currentUser;
        next();
    } catch(err) {
        return next();
    }
});

exports.verifyAccount = catchAsync(async (req, res, next) => {
    const secretToken = crypto.createHash("sha256").update(req.body.secretToken).digest("hex");
    const user = await User.findOne({
        where: {
            secret_token: secretToken,
            secret_token_expires_at: {
                [Sequelize.Op.gte]: Date.now()
            },
            active: false,
            email: req.body.email
        } 
    });
    
    if(!user)
        return next(new AppError('Invalid token or token expired or user already active!!', 400));
    
    user.active = true;
    user.secret_token = null;
    user.secret_token_expires_at = null;
    await user.save();
    
    res.status(200).json({
        status: 'success',
        message: 'Account verified successfully.'
    });

});


exports.forgetPassword = catchAsync(async (req , res, next) => {
    const user = await User.findOne({
        where: {
            email: req.body.email
        }
    });

    if(!user)
        return next(new AppError('User not found!!', 404));
    // create reset token

    const resetToken = user.createSecretToken();
    user.save({validateBeforeSave: false}); 

    // send it to user's email
    if(process.env.NODE_ENV === 'production')
    {
        await new Email(user, resetToken).resetPassword();
        console.log(color.FgMagenta, 'Password reset email sent successfully.', color.Reset);
    }
    else
    {
        console.log(color.FgMagenta, `Reset token: ${resetToken}`, color.Reset);
    }
    res.status(200).json({
        status: 'success',
        message: 'Reset token sent to email successfully'
    });
});

exports.resetToken = catchAsync(async (req, res, next) => {
    const secretToken = crypto.createHash("sha256").update(req.body.secretToken).digest("hex");
    const user = await User.findOne({
        where: {
            secret_token: secretToken,
            secret_token_expires_at: {
                [Sequelize.Op.gte]: Date.now()
            },
            email: req.body.email
        }
    });
    if(!user)
        return next(new AppError('Invalid token or token expired!!', 400));
    res.status(200).json({
        status: 'success',
        message: 'Valid token provided.'
    });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    if(!req.body.password || !req.body.password_confirm)
        return next(new AppError('You must provide password and password_confirm together!!', 400));
    if(!req.body.secretToken || !req.body.email)
        return next(new AppError('You must provide secretToken and email together!!', 400));
    const secretToken = crypto.createHash("sha256").update(req.body.secretToken).digest("hex");
    const email = req.body.email;
    const user = await User.findOne({
        where: {
            secret_token: secretToken,
            secret_token_expires_at: {
                [Sequelize.Op.gte]: Date.now()
            },
            email
        }
    });
    if(!user)
        return next(new AppError('Invalid token or token expired!!', 400));
    user.password = req.body.password;
    user.password_confirm = req.body.password_confirm;
    user.secret_token = null;
    user.secret_token_expires_at = null;
    await user.save();
    res.status(200).json({
        status: 'success',
        message: 'Password reset successfully.',
        data: {
            user
        }
    });
});


exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if(!roles.includes(req.user.role))
            return next(new AppError('You don\'t have permission to perform this action', 403));
        next();
    }
}








exports.changePassword = catchAsync(async (req, res, next) => {
    if(!req.body.current_password || !req.body.new_password || !req.body.new_password_confirm)
        return next(new AppError('You must provide current password, new password and new passwordConfirm together!!', 400));
    const user = await User.findByPk(req.user.id);
    if(!await user.validatePassword(req.body.current_password))
        return next(new AppError('Current password is incorrect!!', 401));
    user.password = req.body.new_password;
    user.password_confirm = req.body.new_password_confirm;
    await user.save();
    res.status(200).json({
        status: 'success',
        message: 'Password changed successfully.'
    });
});
