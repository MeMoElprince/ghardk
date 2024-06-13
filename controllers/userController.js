const User = require('../models/userModel');
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

exports.createUser = catchAsync(async (req, res, next) => {

    const data = filterObj(req.body, 'first_name', 'last_name', 'email', 'password', 'password_confirm', 'role', 'dob', 'gender');
    if(data.role === 'admin') {
        return next(new AppError('You cannot create an admin user', 401));
    }
    
    // hash the password 
    // ,,,,,,,,,,,,,,,,,
    console.log(color.FgCyan, 'Creating user...', color.Reset);
    const user = await User.create(data);
    console.log(color.FgGreen, 'User created successfully.', color.Reset);

    // Create Token
    // ,,,,,,,,,,,,

    res.status(201).json({
        status: 'success',
        data: {
            user
        }
    })

});

// get all users
exports.getAllUsers = catchAsync(async (req, res, next) => {
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 50;
    if(limit > 1000)
        limit = 1000;
    const offset = (page - 1) * limit;

    
    const users = await User.findAll({
        limit,
        offset
    });

    res.status(200).json({
        status: 'success',
        data: {
            users
        }
    });
});

// get user by id
exports.getUser = catchAsync(async (req, res, next) => {
    const user = await User.findByPk(req.params.id);
    if(!user) {
        return next(new AppError('No user found with that ID', 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });
});

// update user by id
exports.updateUser = catchAsync(async (req, res, next) => {
    const user = await User.findByPk(req.params.id);
    if(!user) {
        return next(new AppError('No user found with that ID', 404));
    }
    if(req.body.password || req.body.role) {
        return next(new AppError('You cannot update password or role', 401));
    }
    const data = filterObj(req.body, 'first_name', 'last_name', 'email', 'dob', 'gender', 'language_preference');
    Object.keys(data).forEach(el => {
        user[el] = data[el];
    });
    await user.save();
    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });
});

// delete user by id
exports.deleteUser = catchAsync(async (req, res, next) => {
    const user = await User.findByPk(req.params.id);
    if(!user) {
        return next(new AppError('No user found with that ID', 404));
    }
    await user.destroy();
    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.getMe = catchAsync(async (req, res, next) => {
    // get the user from the database with filtered fields 
    const user = await User.findByPk(req.user.id, {
        attributes: {
            exclude: ['password', 'password_confirm', 'secret_token', 'secret_token_expires_at']
        }
    })

    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });
});