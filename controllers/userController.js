const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const Email = require('../utils/emailHandler');
const color = require('../utils/colors');
const {imageUpload} = require('../utils/multer');
const imageKit = require('imagekit');
const Image = require('../models/imageModel');
const db = require('../config/database');
const { where } = require('sequelize');
const Vendor = require('../models/vendorModel');


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
    console.log(color.FgCyan, "Get User", color.Reset);
    let isVendor = false;

    const vendor = await User.findByPk(req.params.id);
    if(!vendor) {
        return next(new AppError('No user found with that ID', 404));
    }
    if(vendor.role === 'vendor')
    {
        isVendor = true;
    }


    let user = await db.query(
        `
            SELECT
                u.id,
                u.first_name,
                u.last_name,
                u.user_name,
                u.email,
                u.dob,
                u.role,
                u.active,
                u.gender,
                i.url as image_url,
                i.remote_id as image_id ${isVendor ? `, v.description, v.national_id, v.rating, v.rating_count` : ''}
            FROM
                users u
            JOIN
                images i ON u.image_id = i.id 
            ${isVendor ? `JOIN vendors v ON u.id = v.user_id` : ''}
            WHERE
                u.id = ${req.params.id};            
        `
    );

    user = user[0][0];

    if(!user) {
        return next(new AppError('No user found with that ID', 404));
    }

    if(isVendor)
    {
        const categories = await db.query(
            `
                SELECT
                    c.id,
                    c.name
                FROM
                    categories c
                JOIN
                    products p ON c.id = p.category_id
                JOIN 
                    product_items pi ON p.id = pi.product_id
                JOIN 
                    vendors v ON pi.vendor_id = v.id
                WHERE
                    v.user_id = ${req.params.id}    
                GROUP BY
                    c.id;                
            `
        );    
        user.categories = categories[0];
    }

    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });



});


exports.getTopRatedVendors = catchAsync(async (req, res, next) => {
    console.log(color.BgBlue, ' Get Top Rated Vendors::---------------- ', color.Reset);
    const vendors = await db.query(
        `
            SELECT
                u.id,
                u.first_name,
                u.last_name,
                u.user_name,
                u.email,
                u.dob,
                u.role,
                u.active,
                u.gender,
                i.url as image_url,
                i.remote_id as image_id,
                v.description,
                v.rating,
                v.rating_count
            FROM
                users u
            JOIN
                images i ON u.image_id = i.id
            JOIN
                vendors v ON u.id = v.user_id
            ORDER BY
                v.rating DESC
            LIMIT
                20;
        `
    );

    return res.status(200).json({
        status: 'success',
        data: {
            vendors: vendors[0]
        }
    });
});

// update user by id
exports.updateUser = catchAsync(async (req, res, next) => {
    console.log(color.FgCyan, "Update User Route", color.Reset);

    const user = await User.findByPk(req.params.id);
    if(!user) {
        return next(new AppError('No user found with that ID', 404));
    }
    if(req.body.password || req.body.role) {
        return next(new AppError('You cannot update password or role', 401));
    }
    const data = filterObj(req.body, 'first_name', 'last_name', 'user_name', 'dob', 'gender', 'language_preference');
    Object.keys(data).forEach(el => {
        user[el] = data[el];
    });
    console.log(color.FgGreen, 'User updated successfully.', color.Reset);
    console.log(data);
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
    console.log(color.FgCyan, "Delete User Route", color.Reset);

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
    console.log(color.FgCyan, "Get Me Route", color.Reset);
    // get the user from the database with filtered fields 
    let user;
    if(req.user.role === 'vendor')
    {

        user = await db.query(
            `
                SELECT
                    u.id,
                    u.first_name,
                    u.last_name,
                    u.user_name,
                    u.email,
                    u.dob,
                    u.role,
                    u.gender,
                    u.active,
                    u.language_preference,
                    i.url as image_url,
                    i.remote_id as image_id,
                    v.national_id,
                    v.description,
                    v.rating,
                    v.rating_count
                FROM
                    users u
                JOIN
                    images i ON u.image_id = i.id
                JOIN
                    vendors v ON u.id = v.user_id
                WHERE   
                    u.id = ${req.user.id};
            `
        );
    }
    else{
        user = await db.query(
            `
                SELECT
                    u.id,
                    u.first_name,
                    u.last_name,
                    u.user_name,
                    u.email,
                    u.dob,
                    u.role,
                    u.gender,
                    u.active,
                    u.language_preference,
                    i.url as image_url,
                    i.remote_id as image_id
                FROM
                    users u
                JOIN
                    images i ON u.image_id = i.id
                WHERE   
                    u.id = ${req.user.id};
            `
        );
    }
    if(!user) {
        return next(new AppError('No user found with that ID', 404));
    }

    user = user[0][0];


    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });
});

exports.updateMe = catchAsync(async (req, res, next) => {
    console.log(color.FgCyan, "Update Me Route", color.Reset);
    const data = filterObj(req.body, 'first_name', 'last_name', 'dob', 'gender', 'user_name');
    const { user } = req;
    const currentData = {};
    Object.keys(data).forEach(el => {
        currentData[el] = user[el];
        user[el] = data[el];
    });
    let vendorData;
    let currentVendorData = {};
    let vendor;
    if(user.role === 'vendor')
    {
        vendor = await Vendor.findOne({
            where: {
                user_id: req.user.id
            }   
        });
        if(!vendor)
        {
            return next(new AppError('Vendor not found', 404));   
        }
        vendorData = filterObj(req.body, 'national_id', 'description');
        Object.keys(vendorData).forEach(el => {
            currentVendorData[el] = vendor[el];
            vendor[el] = vendorData[el];
        });
        await vendor.save();
    }
    try
    {
        await user.save();
    } catch (err) {
        if(user.role === 'vendor')
        {
            Object.keys(currentVendorData).forEach(el => {
                vendor[el] = currentVendorData[el];
            });
            await vendor.save();
        }
        return next(new AppError(err.message, 400));
    }
    if(req.body.image) {
        try {
            const image = await imageKitConfig.upload({
                file: req.body.image.buffer.toString('base64'),
                fileName: req.body.image.originalname,
                folder: '/users'
            });
            const currentImage = await Image.findByPk(user.image_id);
            if(currentImage.remote_id)
                await imageKitConfig.deleteFile(currentImage.remote_id);
            currentImage.url = image.url;
            currentImage.remote_id = image.fileId;
            await currentImage.save();
        } catch(err) {
            Object.keys(currentData).forEach(el => {
                user[el] = currentData[el];
            });
            if(user.role === 'vendor')
            {
                Object.keys(currentVendorData).forEach(el => {
                    vendor[el] = currentVendorData[el];
                });
                await vendor.save();
            }
            await user.save();
            return next(new AppError('Error editing image', 500));
        }
    }
    console.log(color.FgGreen, 'User updated successfully.', color.Reset);
    user.password = undefined;
    user.password_confirm = undefined;
    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });
});