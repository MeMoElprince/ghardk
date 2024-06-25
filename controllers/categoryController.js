const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const color = require('../utils/colors');
const Category = require('../models/categoryModel');
const crudFactory = require('./crudFactory');
const Image = require('../models/imageModel');
const db = require('../config/database');
const {imageUpload} = require('../utils/multer');
const imageKit = require('imagekit');




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







exports.getCategory = catchAsync(async (req, res, next) => {
    

    let category = await db.query(
        `
            SELECT
                c.id,
                c.name,
                c.parent_category_id,
                i.url as image_url,
                i.remote_id as image_remote_id
            FROM
                categories c
            JOIN
                images i ON c.image_id = i.id
            WHERE
                c.id = ${req.params.id}
        `
    );

    category = category[0][0];
    



    if(!category)
        return next(new AppError('Category not found', 404));
    res.status(200).json({
        status: 'success',
        data: {
            category
        }
    });
});

exports.getAllCategories = catchAsync(async (req, res, next) => {

    let categories = await db.query(
        `
            SELECT 
                c.id, 
                c.name, 
                c.parent_category_id, 
                i.url as image_url,
                i.remote_id as image_remote_id
            FROM
                categories c
            JOIN
                images i ON c.image_id = i.id
        `
    );
    categories = categories[0];
    res.status(200).json({
        status: 'success',
        data: {
            count: categories.length,
            categories
        }
    });

});
exports.updateCategory = catchAsync(async (req, res, next) => {
    const category = await Category.findByPk(req.params.id);
    if(!category)
        return next(new AppError('Category not found', 404));
    if(req.body.image) {
        const image = await Image.findByPk(category.image_id);
        if(!image)
            return next(new AppError('Image not found', 500));
        let newImage;
        try {
            newImage = await imageKitConfig.upload({
                file: req.body.image.buffer.toString('base64'),
                fileName: req.body.image.originalname,
                folder: 'categories/'
            });
        } catch (err) {
            console.error(err);
            return next(new AppError('Error uploading image', 500));
        }
        await imageKitConfig.deleteFile(image.remote_id);
        image.url = newImage.url;
        image.remote_id = newImage.fileId;
        await image.save();
    }
    const data = filterObj(req.body, 'name', 'parent_category_id');
    await category.update(data);
    res.status(200).json({
        status: 'success',
        data: {
            category
        }
    });
});


exports.deleteCategory = catchAsync(async (req, res, next) => {
    const category = await Category.findByPk(req.params.id);
    if(!category)
        return next(new AppError('Category not found', 404));

    const image = await Image.findByPk(category.image_id);
    if(!image)
        return next(new AppError('Image not found', 500));

    await imageKitConfig.deleteFile(image.remote_id);
    await category.destroy();
    await image.destroy();
    
    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.createCategory = catchAsync(async (req, res, next) => {
    if(!req.body.image)
        return next(new AppError('Image is required', 400));
    let image;
    let newImage;
    try {
        image = await imageKitConfig.upload({
            file: req.body.image.buffer.toString('base64'),
            fileName: req.body.image.originalname,
            folder: 'categories/'
        });
        try {
            newImage = await Image.create({
                url: image.url,
                remote_id: image.fileId
            });
        } catch (err) {
            console.error(err);
            await imageKitConfig.deleteFile(image.fileId);
            return next(new AppError('Error creating image', 500));
        }
    } catch (err) {
        console.error(err);
        return next(new AppError('Error uploading image', 500));
    };

    const data = filterObj(req.body, 'name', 'parent_category_id');
    data.image_id = newImage.id;
    let newCategory;
    try {
        newCategory = await Category.create(data);
    } catch (err) {
        console.error(err);
        await newImage.destroy();
        await imageKitConfig.deleteFile(image.fileId);
        return next(new AppError('Error creating category', 500));
    }
    res.status(201).json({
        status: 'success',
        data: {
            category: newCategory
        }
    });

});
