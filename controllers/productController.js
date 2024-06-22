const Product = require('../models/productModel');
const ProductItem = require('../models/productItemModel');
const Vendor = require('../models/vendorModel');
const color = require('../utils/colors');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const crudFactory = require('./crudFactory');
const { imageUpload } = require('../utils/multer');
const imageKit = require('imagekit');
const Image = require('../models/imageModel');
const ProductImage = require('../models/productImageModel');
const fetch = require('node-fetch');
const db = require('../config/database');

const imageKitConfig = new imageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});



exports.uploadProductImage = imageUpload.fields([
    {name: 'images', maxCount: 10, minCount: 1},
]);

exports.uploadProductImageToImageKit = catchAsync(async (req, res, next) => {
    if(!req.files.images) {
        return next(new AppError('Please upload an image', 400));
    }
    req.body.images = req.files.images;
    next();
});




const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if(allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
}

exports.createProduct = crudFactory.createOne(Product, 'name', 'description', 'category_id');
exports.getAllProducts = crudFactory.getAll(Product);
exports.getProduct = crudFactory.getOne(Product);
exports.updateProduct = crudFactory.updateOne(Product, 'name', 'description', 'category_id');
exports.deleteProduct = crudFactory.deleteOne(Product);




exports.createNewProductItem = catchAsync(async (req, res, next) => {
    let data = filterObj(req.body, 'name', 'description', 'category_id');
    const newProduct = await Product.create(data);

    const vendor = await Vendor.findOne({where: {user_id: req.user.id}});
    if(!vendor) {
        await newProduct.destroy();
        return next(new AppError('Vendor not found', 404));
    } 
    data = filterObj(req.body, 'price', 'quantity');
    data.vendor_id = vendor.id;
    data.product_id = newProduct.id;
    let productItem;
    try{
        productItem = await ProductItem.create(data);
    } catch(err){
        await newProduct.destroy();
        return next(new AppError(`Product Item could not be created, ${err.message}`, 500));
    }


    // Add to AI DB
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    const aiData = {
        id: `${productItem.id}`,
        name: newProduct.name,
        description: newProduct.description
    };
    const raw = JSON.stringify(aiData);
    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
    };
    const response = await fetch(`${process.env.AI_URL}/item`, requestOptions);
    const result = await response.json();
    console.log(result);


    res.status(201).json({
        status: 'success',
        data: {
            productItem
        }
    });
});

// Not Completed
exports.getAllMyProductItems = catchAsync(async (req, res, next) => {
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 10;
    const offset = (page - 1) * limit;
    const vendor = await Vendor.findOne({where: {user_id: req.user.id}});
    if(!vendor) {
        return next(new AppError('Vendor not found', 404));
    }
    const productItems = await ProductItem.findAll({
        where: {
            vendor_id: vendor.id
        },
        limit,
        offset,
    });
    res.status(200).json({
        status: 'success',
        data: {
            count: productItems.length,
            productItems
        }
    });
});
// Not Completed


exports.updateMyProductItem = catchAsync(async (req, res, next) => {
    let data = filterObj(req.body, 'price', 'quantity');
    const productItem = await ProductItem.findByPk(req.params.id);
    if(!productItem) {
        return next(new AppError('Product Item not found', 404));
    }
    if(data.price || data.quantity) {
        await productItem.update(data);
    }
    data = filterObj(req.body, 'name', 'description', 'category_id');
    if(data.name || data.description || data.category_id) {
        const product = await Product.findByPk(productItem.product_id);
        if(!product) {
            return next(new AppError('Product not found', 404));
        }
        await product.update(data);
        productItem.product_id = product;
    }   
    
    // Update AI DB
    if(data.name || data.description) {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        const aiData = {
            name: data.name,
            description: data.description
        };
        const raw = JSON.stringify(aiData);
        const requestOptions = {
            method: "PATCH",
            headers: myHeaders,
            body: raw,
            redirect: "follow",
        };
        const response = await fetch(`${process.env.AI_URL}/item/${productItem.id}`, requestOptions);
        const result = await response.json();
        console.log({result});
        console.log('If Error Message:', result.detail);
    }

    res.status(200).json({
        status: 'success',
        data: {
            productItem
        }
    });
});

exports.deleteMyProductItem = catchAsync(async (req, res, next) => {
    const productItem = await ProductItem.findByPk(req.params.id);
    if(!productItem) {
        return next(new AppError('Product Item not found', 404));
    }
    const product = await Product.findByPk(productItem.product_id);
    const productImages = await ProductImage.findAll({
        where: {
            product_item_id: productItem.id
        }
    });
    for(let i = 0; i < productImages.length; i++) {
        const productImage = productImages[i];
        const image = await Image.findByPk(productImage.image_id);
        await productImage.destroy();
        if(image) {
            try {
                await imageKitConfig.deleteFile(image.remote_id);
                await image.destroy();
            } catch(err) {
                console.log(err.message);
            }
        }
    }
    if(!product) {
        await productItem.destroy();
        // Delete from AI DB
        const requestOptions = {
            method: "DELETE",
            redirect: "follow",
        };
        const response = await fetch(`${process.env.AI_URL}/item/${productItem.id}`, requestOptions);
        const result = await response.json();
        console.log({result});
        console.log('If Error Message:', result.detail);
        return res.status(204).json({
            status: 'success',
            data: null
        });
    }
    await productItem.destroy();
    await product.destroy();
    // Delete from AI DB
    const requestOptions = {
        method: "DELETE",
        redirect: "follow",
    };
    const response = await fetch(`${process.env.AI_URL}/item/${productItem.id}`, requestOptions);
    const result = await response.json();
    console.log({result});
    console.log('If Error Message:', result.detail);

    res.status(204).json({
        status: 'success',
        data: null
    });
});


exports.createProductImages = catchAsync(async (req, res, next) => {
    const productItem = await ProductItem.findByPk(req.params.productId);
    if(!productItem) {
        return next(new AppError('Product item not found', 404));
    }
    if(!req.files.images) {
        return next(new AppError('Please upload an image', 400));
    }
    const images = req.body.images;
    const imageUrls = [];
    for(let i = 0; i < images.length; i++) {
        const image = images[i];
        const imageKitResponse = await imageKitConfig.upload({
            file: image.buffer.toString('base64'),
            fileName: image.originalname,
            folder: `/productImages`
        });
        imageUrls.push(imageKitResponse.url);
        const newImage = await Image.create({
            url: imageKitResponse.url,
            remote_id: imageKitResponse.fileId,
        });
        const productImage = await ProductImage.create({
            product_item_id: productItem.id,
            image_id: newImage.id
        })
    }
    res.status(201).json({
        status: 'success',
        data: {
            imageUrls
        }
    });
});

exports.deleteProductImage = catchAsync(async (req, res, next) => {
    const productImage = await ProductImage.findByPk(req.params.id);
    if(!productImage) {
        return next(new AppError('Product Image not found', 404));
    }
    const image = await Image.findByPk(productImage.image_id);
    if(!image) {
        await productImage.destroy();
        return res.status(204).json({
            status: 'success',
            data: null
        });
    }
    await productImage.destroy();
    await imageKitConfig.deleteFile(image.remote_id);
    await image.destroy();
    res.status(204).json({
        status: 'success',
        data: null
    });
});


// Ai 


exports.getSimilarProductsByText = catchAsync(async (req, res, next) => {
    const { text } = req.params;
    let { limit } = req.query * 1;
    limit = Math.min(limit, 50);
    console.log(text);
    let url = `${process.env.AI_URL}/item/text/${text}`;
    if(limit)
        url += `?limit=${limit}`;
    const response = await fetch(url);
    const result = await response.json();
    let data = [];
    for(let i = 0; i < result.ids.length; i++) {
        const id = result.ids[i] * 1;
        // if id is not a number         because we made id a number and if it is not a number then it is NaN and NaN !== NaN
        if(id !== id)
            continue;
        let productItem = await db.query(
            `
                SELECT product_items.id, products.name, products.description, product_items.quantity, product_items.price
                FROM product_items
                JOIN products ON product_items.product_id = products.id
                WHERE product_items.id = ${id}
            `
        );
        if(productItem[0].length === 0)
            continue;
        productItem = productItem[0];
        const productImages = await db.query(
            `
                SELECT images.url AS image_url , images.remote_id AS image_id
                FROM product_images
                JOIN images ON product_images.image_id = images.id
                WHERE product_images.product_item_id = ${id}
            `
        );
        productItem.images = productImages[0];

        let dataItem = {
            images: productImages[0]
        };
        dataItem = {...productItem[0], ...dataItem};
        data.push(dataItem);
    }
    console.log('If Error Message: ', result.detail);
    res.status(200).json({
        status: "success",
        data
    });
});