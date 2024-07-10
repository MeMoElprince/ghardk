const Product = require('../models/productModel');
const ProductItem = require('../models/productItemModel');
const Vendor = require('../models/vendorModel');
const color = require('../utils/colors');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const crudFactory = require('./crudFactory');
const { imageUpload } = require('../utils/multer');
const imageKit = require('imagekit');
const Image = require('../models/imageModel');
const ProductImage = require('../models/productImageModel');
const fetch = require('node-fetch');
const db = require('../config/database');
const ProductConfiguration = require('../models/productConfigurationModel');
const Customer = require('../models/customerModel');
const Review = require('../models/reviewModel');

const imageKitConfig = new imageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});


exports.loadImage = imageUpload.single('image');

exports.uploadProductImage = imageUpload.fields([
    {name: 'images', maxCount: 10, minCount: 1},
]);

exports.loadImageToBody = catchAsync(async (req, res,next)=> {
    if(!req.file)
        return next(new AppError('Please upload an image', 400));
    req.body.image = req.file;
    next();
});

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


exports.getPopularProducts = catchAsync(async (req, res, next) => {
    let products = await db.query(
        `
            SELECT 
                pi.id, 
                p.name, 
                p.description, 
                pi.quantity, 
                pi.price,
                pi.rating,
                pi.rating_count,
                c.name as category_name,
                u.id as vendor_id,
                u.user_name as vendor_user_name,
                u.first_name as vendor_first_name,
                u.last_name as vendor_last_name,
                u.email as vendor_email,
                v.rating as vendor_rating,
                v.rating_count as vendor_rating_count,
                v.description as vendor_description,
                i.url as vendor_image_url,
                i.remote_id as vendor_image_id,
                COUNT(si.product_item_id) as sales_count
            FROM 
                product_items pi
            JOIN 
                sales_items si ON pi.id = si.product_item_id
            JOIN 
                products p ON pi.product_id = p.id
            JOIN
                categories c ON p.category_id = c.id
            JOIN 
                vendors v ON pi.vendor_id = v.id
            JOIN
                users u ON v.user_id = u.id
            JOIN
                images i ON u.image_id = i.id
            GROUP BY 
                i.url,
                i.remote_id,
                pi.id, 
                p.name, 
                p.description, 
                pi.quantity, 
                pi.price,
                c.name,
                u.id,
                u.user_name,
                u.first_name,
                u.last_name,
                u.email,
                v.rating,
                v.rating_count,
                v.description
            ORDER BY 
                sales_count DESC
            LIMIT 100
        `
    );

    for(let i = 0; i < products[0].length; i++) {
        const productItem = products[0][i];
        const productImages = await db.query(
            `
                SELECT 
                    i.url as image_url,
                    i.remote_id as image_id,
                    pi.id as product_image_id
                FROM 
                    product_images pi
                JOIN 
                    images i ON pi.image_id = i.id
                WHERE 
                    pi.product_item_id = ${productItem.id}
            `
        );
        productItem.images = productImages[0];
        productItem.isFavourite = false;
        if(req.user)
        {
            let favourite = await db.query(
                `
                    SELECT
                        *
                    FROM
                        favourite_products
                    JOIN
                        customers c ON favourite_products.customer_id = c.id
                    WHERE
                        favourite_products.product_item_id = ${productItem.id} AND c.user_id = ${req.user.id}
                `
            );
            if(favourite[0].length > 0)
                productItem.isFavourite = true;
        }


    }

    res.status(200).json({
        status: 'success',
        data: {
            count: products[0].length,
            products: products[0]
        }
    });
});


exports.getAllProductsByVendor = catchAsync(async (req, res, next) => {
    const { vendorId } = req.params;

    const vendor = await Vendor.findOne({
        where: {
            user_id: vendorId
        }
    });
    if(!vendor) {
        return next(new AppError('Vendor not found', 404));
    }

    let productItems = await db.query(
        `
            SELECT 
                pi.id, 
                p.name, 
                p.description, 
                pi.quantity, 
                pi.price,
                pi.rating,
                pi.rating_count,
                c.name as category_name,
                c.id as category_id
            FROM 
                product_items pi
            JOIN 
                products p ON pi.product_id = p.id
            JOIN
                categories c ON p.category_id = c.id
            WHERE 
                pi.vendor_id = ${vendor.id} AND ${req.query.category_id ? `p.category_id = ${req.query.category_id}` : true}
        `
    );

    for(let i = 0; i < productItems[0].length; i++) {
        const productItem = productItems[0][i];
        const productImages = await db.query(
            `
                SELECT 
                    i.url as image_url,
                    i.remote_id as image_id,
                    pi.id as product_image_id
                FROM 
                    product_images pi
                JOIN 
                    images i ON pi.image_id = i.id
                WHERE 
                    pi.product_item_id = ${productItem.id}
            `
        );
        productItem.images = productImages[0];
        productItem.isFavourite = false;
        if(req.user)
        {
            let favourite = await db.query(
                `
                    SELECT
                        *
                    FROM
                        favourite_products
                    JOIN
                        customers c ON favourite_products.customer_id = c.id
                    WHERE
                        favourite_products.product_item_id = ${productItem.id} AND c.user_id = ${req.user.id}
                `
            );
            if(favourite[0].length > 0)
                productItem.isFavourite = true;
        }
    }


    res.status(200).json({
        status: 'success',
        data: {
            count: productItems[0].length,
            products: productItems[0]
        }
    });
});


exports.getProductItem = catchAsync(async (req, res, next) => {
    const id = req.params.id;
    let productItem = await db.query(
        `
            SELECT 
                pi.id, 
                p.name, 
                p.description, 
                pi.quantity, 
                pi.price,
                pi.rating,
                pi.rating_count,
                u.id as vendor_id,
                u.user_name as vendor_user_name,
                u.first_name as vendor_first_name,
                u.last_name as vendor_last_name,
                u.email as vendor_email,
                i.url as vendor_image_url,
                i.remote_id as vendor_image_id,
                v.rating as vendor_rating,
                v.rating_count as vendor_rating_count,
                v.description as vendor_description
            FROM 
                product_items pi
            JOIN 
                products p ON pi.product_id = p.id
            JOIN 
                vendors v ON pi.vendor_id = v.id
            JOIN
                users u ON v.user_id = u.id
            JOIN 
                images i ON u.image_id = i.id
            WHERE pi.id = ${id}
        `
    );

    if(productItem[0].length === 0) {
        return next(new AppError('Product Item not found', 404));
    }
    productItem = productItem[0][0];

    let productImages = await db.query(
        `
            SELECT 
                i.url as image_url,
                i.remote_id as image_id,
                pi.id as product_image_id
            FROM 
                product_images pi
            JOIN 
                images i ON pi.image_id = i.id
            WHERE pi.product_item_id = ${id}
        `
    );
    productItem.images = productImages[0];

    productItem.isFavourite = false;
    productItem.canReview = false;
    if(req.user)
    {
        let favourite = await db.query(
            `
                SELECT
                    *
                FROM
                    favourite_products
                JOIN
                    customers c ON favourite_products.customer_id = c.id
                WHERE
                    favourite_products.product_item_id = ${productItem.id} AND c.user_id = ${req.user.id}
            `
        );
        if(favourite[0].length > 0)
            productItem.isFavourite = true;
        
        const customer = await Customer.findOne({
            where: {
                user_id: req.user.id
            }
        });
        if(customer)
        {
            const review = await Review.findOne({
                where: {
                    product_item_id: id,
                    customer_id: customer.id,
                    status: 'pending'
                }
            });
            if(review)
            {
                productItem.canReview = true;
            }
        }
        
    }

    let productConfigurations = await db.query(
        `
            SELECT
                v.name,
                vo.value
            FROM 
                product_configurations pc
            JOIN
                variation_options vo ON pc.variation_option_id = vo.id
            JOIN
                variations v ON vo.variation_id = v.id
            WHERE 
                pc.product_item_id = ${id}
        `
    );
    productItem.configurations = productConfigurations[0];
    // is favourite





    res.status(200).json({
        status: 'success',
        data: {
            productItem
        }
    });
});


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
    try {

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
    } catch (err) {
        console.log('Error happened while adding product to AI :', err.message);
    }


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
    const limit = req.query.limit * 1 || 50;
    const offset = (page - 1) * limit;
    const vendor = await Vendor.findOne({where: {user_id: req.user.id}});
    if(!vendor) {
        return next(new AppError('Vendor not found', 404));
    }
    let productItems = await db.query(
        `
            SELECT 
                pi.id, 
                p.name, 
                p.description, 
                pi.quantity, 
                pi.price,
                pi.rating,
                pi.rating_count,
                c.name as category_name,
                c.id as category_id
            FROM
                product_items pi
            JOIN
                products p ON pi.product_id = p.id
            JOIN
                categories c ON p.category_id = c.id
            WHERE
                pi.vendor_id = ${vendor.id} AND ${req.query.category_id ? `p.category_id = ${req.query.category_id}` : true}
            OFFSET ${offset} LIMIT ${limit}
        `
    );
    productItems = productItems[0];

    for(let i = 0; i < productItems.length; i++) {
        const item = productItems[i];
        const productImages = await db.query(
            `
                SELECT 
                    i.url as image_url,
                    i.remote_id as image_id,
                    pi.id as product_image_id
                FROM 
                    product_images pi
                JOIN 
                    images i ON pi.image_id = i.id
                WHERE 
                    pi.product_item_id = ${item.id}
            `
        );
        item.images = productImages[0];
    }
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
    try {
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
    } catch (err) {
        console.log('Error happened while updating product in AI :', err.message);
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
    try {
        const requestOptions = {
            method: "DELETE",
            redirect: "follow",
        };
        const response = await fetch(`${process.env.AI_URL}/item/${productItem.id}`, requestOptions);
        const result = await response.json();
        console.log({result});
        console.log('If Error Message:', result.detail);
    } catch(err) {
        console.log('Error happened while deleting product from AI :', err.message);
    }

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
    const productImages = [];
    for(let i = 0; i < images.length; i++) {
        const image = images[i];
        
        const imageKitResponse = await imageKitConfig.upload({
            file: image.buffer.toString('base64'),
            fileName: image.originalname,
            folder: `/productImages`
        });
        const newImage = await Image.create({
            url: imageKitResponse.url,
            remote_id: imageKitResponse.fileId,
        });
        const productImage = await ProductImage.create({
            product_item_id: productItem.id,
            image_id: newImage.id
        })
        productImages.push({
            product_image_id: productImage.id,
            url: newImage.url,
            remote_id: newImage.remote_id
        });
        const imageBase64 = image.buffer.toString('base64');
        const itemId = productItem.id;
        const imageId = newImage.id;
        try {
            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            const aiData = {
                item_id: `${itemId}`,
                image_id: `${imageId}`,
                image_base64: imageBase64
            };
            const raw = JSON.stringify(aiData);
            const requestOptions = {
                method: "POST",
                headers: myHeaders,
                body: raw,
                redirect: "follow",
            };
            const response = await fetch(`${process.env.AI_URL}/item/image`, requestOptions);
            const result = await response.json();
        } catch(err)
        {
            console.log("Error while uploading image to AI: ", err.message);
        }
    }
    res.status(201).json({
        status: 'success',
        data: {
            count: productImages.length,
            productImages
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

    const imageId = image.id;

    await productImage.destroy();
    await imageKitConfig.deleteFile(image.remote_id);
    await image.destroy();

    try{
        const requestOptions = {
            method: "DELETE",
            redirect: "follow",
        };
        const response = await fetch(`${process.env.AI_URL}/item/image/${imageId}`, requestOptions);
        const result = await response.json();
        console.log(result);

    } catch(err){ 
        console.log("Error while deleting image from AI: ", err.message);
    }

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
                SELECT 
                    pi.rating, 
                    pi.rating_count, 
                    pi.id, 
                    p.name, 
                    p.description, 
                    pi.quantity, 
                    pi.price,
                    c.name as category_name,
                    c.id as category_id,
                    u.id as vendor_id,
                    u.user_name as vendor_user_name,
                    u.first_name as vendor_first_name,
                    u.last_name as vendor_last_name,
                    u.email as vendor_email,
                    v.rating as vendor_rating,
                    v.rating_count as vendor_rating_count,
                    v.description as vendor_description,
                    i.url as vendor_image_url,
                    i.remote_id as vendor_image_id
                FROM 
                    product_items pi
                JOIN 
                    products p ON pi.product_id = p.id
                JOIN
                    categories c ON p.category_id = c.id
                JOIN
                    vendors v ON pi.vendor_id = v.id
                JOIN
                    users u ON v.user_id = u.id
                JOIN
                    images i ON u.image_id = i.id
                WHERE 
                    pi.id = ${id}
            `
        );
        if(productItem[0].length === 0)
            continue;
        productItem = productItem[0];
        const productImages = await db.query(
            `
                SELECT 
                    images.url AS image_url, 
                    images.remote_id AS image_id, 
                    pi.id AS product_image_id
                FROM 
                    product_images pi
                JOIN 
                    images ON pi.image_id = images.id
                WHERE 
                    pi.product_item_id = ${id}
            `
        );
        productItem.images = productImages[0];
        productItem.isFavourite = false;
        if(req.user)
        {
            let favourite = await db.query(
                `
                    SELECT
                        *
                    FROM
                        favourite_products
                    JOIN
                        customers c ON favourite_products.customer_id = c.id
                    WHERE
                        favourite_products.product_item_id = ${productItem[0].id} AND c.user_id = ${req.user.id}
                `
            );
            if(favourite[0].length > 0)
                productItem.isFavourite = true;
        }
        let dataItem = {
            images: productImages[0]
        };
        dataItem = {...productItem[0], ...dataItem, isFavourite: productItem.isFavourite};
        data.push(dataItem);
    }
    console.log('If Error Message: ', result.detail);
    res.status(200).json({
        status: "success",
        data
    });
});



exports.getExploreProducts = catchAsync(async (req, res, next) => {
    
    // ai callback
    const sortQuery = req.query.sort || 'updatedAt';
    const sortType = req.query.sortType || 'DESC';
    const minPrice = req.query.minPrice || 0;
    const maxPrice = req.query.maxPrice || 1000000000;
    let productItems = await db.query(
        `
            SELECT 
                pi.id, 
                p.name, 
                p.description, 
                pi.quantity, 
                pi.price,
                pi.rating,
                pi.rating_count,
                c.name as category_name,
                c.id as category_id,
                pi."createdAt",
                pi."updatedAt",
                u.id as vendor_id,
                u.user_name as vendor_user_name,
                u.first_name as vendor_first_name,
                u.last_name as vendor_last_name,
                u.email as vendor_email,
                v.rating as vendor_rating,
                v.rating_count as vendor_rating_count,
                v.description as vendor_description,
                i.url as vendor_image_url,
                i.remote_id as vendor_image_id
            FROM 
                product_items pi
            JOIN 
                products p ON pi.product_id = p.id
            JOIN
                categories c ON p.category_id = c.id
            JOIN
                vendors v ON pi.vendor_id = v.id
            JOIN
                users u ON v.user_id = u.id
            JOIN
                images i ON u.image_id = i.id
            WHERE 
                ${req.query.category_id ? `p.category_id = ${req.query.category_id}` : true}
                And pi.price >= ${minPrice} AND pi.price <= ${maxPrice}
            ORDER BY 
                pi."${sortQuery}" ${sortType}
            LIMIT 100
        `
    );

    for(let i = 0; i < productItems[0].length; i++) {
        const productItem = productItems[0][i];
        const productImages = await db.query(
            `
                SELECT 
                    i.url as image_url,
                    i.remote_id as image_id,
                    pi.id as product_image_id
                FROM 
                    product_images pi
                JOIN 
                    images i ON pi.image_id = i.id
                WHERE 
                    pi.product_item_id = ${productItem.id}
            `
        );
        productItem.images = productImages[0];
        productItem.isFavourite = false;
        if(req.user)
        {
            let favourite = await db.query(
                `
                    SELECT
                        *
                    FROM
                        favourite_products
                    JOIN
                        customers c ON favourite_products.customer_id = c.id
                    WHERE
                        favourite_products.product_item_id = ${productItem.id} AND c.user_id = ${req.user.id}
                `
            );
            if(favourite[0].length > 0)
                productItem.isFavourite = true;
        }
    }

    res.status(200).json({
        status: 'success',
        data: {
            count: productItems[0].length,
            productItems: productItems[0]
        }
    });

});


async function getItemIdsOfInterest(userId){

    let favouriteItems = await db.query(
        `
            SELECT 
                pi.id
            FROM 
                product_items pi 
            JOIN 
                favourite_products fp ON pi.id = fp.product_item_id
            JOIN
                customers c ON fp.customer_id = c.id
            WHERE 
                c.user_id = ${userId}
            LIMIT
                20
        `
    );

    let saleItems = await db.query(
        `
            SELECT 
                pi.id
            FROM
                product_items pi
            JOIN
                sales_items si ON pi.id = si.product_item_id
            JOIN
                sales s ON si.sale_id = s.id
            JOIN
                customers c ON s.customer_id = c.id
            WHERE 
                c.user_id = ${userId}
            LIMIT
                20
        `
    );

    let cartItems = await db.query(
        `
            SELECT 
                pi.id
            FROM 
                product_items pi
            JOIN
                cart_products cp ON pi.id = cp.product_item_id
            JOIN
                carts c ON cp.cart_id = c.id
            JOIN
                customers cu ON c.customer_id = cu.id
            WHERE 
                cu.user_id = ${userId}
            LIMIT
                20
        `
    );
    const allItemIds = favouriteItems[0].concat(saleItems[0]).concat(cartItems[0]).map(item => `${item.id}`);
    const idsSet = new Set(allItemIds);
    return Array.from(idsSet);
};


async function getItemsImageAndIsFavourite(productItems, req){
    for(let i = 0; i < productItems.length; i++) {
        const productItem = productItems[i];
        const productImages = await db.query(
            `
                SELECT 
                    i.url as image_url,
                    i.remote_id as image_id,
                    pi.id as product_image_id
                FROM 
                    product_images pi
                JOIN 
                    images i ON pi.image_id = i.id
                WHERE 
                    pi.product_item_id = ${productItem.id}
            `
        );
        productItem.images = productImages[0];
        productItem.isFavourite = false;
        if(req.user)
        {
            let favourite = await db.query(
                `
                    SELECT
                        *
                    FROM
                        favourite_products
                    JOIN
                        customers c ON favourite_products.customer_id = c.id
                    WHERE
                        favourite_products.product_item_id = ${productItem.id} AND c.user_id = ${req.user.id}
                `
            );
            if(favourite[0].length > 0)
                productItem.isFavourite = true;
        }
    }
    return productItems;
};

async function getProductItem(id, req)
{
    
    let productItem;
    try{
        productItem = await db.query(
            `
                SELECT
                    pi.id,
                    p.name,
                    p.description,
                    pi.quantity,
                    pi.price,
                    pi.rating,
                    pi.rating_count,
                    c.name as category_name,
                    c.id as category_id,
                    u.id as vendor_id,
                    u.user_name as vendor_user_name,
                    u.first_name as vendor_first_name,
                    u.last_name as vendor_last_name,
                    u.email as vendor_email,
                    v.description as vendor_description,
                    v.rating as vendor_rating,
                    v.rating_count as vendor_rating_count,
                    i.url as vendor_image_url,
                    i.remote_id as vendor_image_id
                FROM
                    product_items pi
                JOIN
                    products p ON pi.product_id = p.id
                JOIN
                    categories c ON p.category_id = c.id
                JOIN
                    vendors v ON pi.vendor_id = v.id
                JOIN
                    users u ON v.user_id = u.id
                JOIN
                    images i ON u.image_id = i.id
                WHERE
                    pi.id = ${id}
            `
        );
    } catch(err)
    {
        console.log(err.message)
    }
    if(!productItem || productItem[0].length === 0)
    {
        return null;
    }
    console.log(color.BgBlue, "After", color.Reset);
    productItem = productItem[0][0];
    let productImages = await db.query(
        `
            SELECT
                i.url as image_url,
                i.remote_id as image_id,
                pi.id as product_image_id
            FROM
                product_images pi
            JOIN
                images i ON pi.image_id = i.id
            WHERE
                pi.product_item_id = ${id}
        `
    );
    productItem.images = productImages[0];
    productItem.isFavourite = false;
    if(req.user)
    {
        let favourite = await db.query(
            `
                SELECT
                    *
                FROM
                    favourite_products
                JOIN
                    customers c ON favourite_products.customer_id = c.id
                WHERE
                    favourite_products.product_item_id = ${productItem.id} AND c.user_id = ${req.user.id}
            `
        );
        if(favourite[0].length > 0)
            productItem.isFavourite = true;
    }
    return productItem;
};

exports.getForYouProducts = catchAsync(async (req ,res, next) => {
    let limit = req.query.limit || 50;
    limit = Math.min(limit, 50);
    console.log(color.FgBlue, 'ForYou Route', color.Reset);
    let ids = [];

    if(req.user)
    {
        try {
            ids = await getItemIdsOfInterest(req.user.id);
        } catch (err) {
            console.log(err.message);
        }   
    }
    let productItems = [];
    let shouldGetData = false;
    try{
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        let aiData = {
            ids
        };
        const raw = JSON.stringify(aiData);
        console.log(aiData);

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow",
        };
        let response;
        try {
            response = await fetch(`${process.env.AI_URL}/items/ids?limit=${limit}`, requestOptions);
        }  catch (err) {
            throw new Error('Error happened while getting for you products from AI :', err.message);
        }
        console.log(response.status);
        let result = await response.json();
        result = result.ids;
        console.log(result);
        for(let i = 0; i < result.length; i++) {
            const id = result[i];
            if(id !== id)
                continue;
            let productItem = await getProductItem(id, req);
            if(productItem)
                productItems.push(productItem);
        }
        if(productItems.length === 0)
        {
            throw new AppError("No data received", 404);
        }
    } catch (err) {
        console.log("Error happened while getting for you products from AI", err.message);
        shouldGetData = true;
    }
    if(shouldGetData)
    {
        console.log(color.FgBlue, 'Getting data from DB', color.Reset);
        productItems = await db.query(
            `
                SELECT
                    pi.id,
                    p.name,
                    p.description,
                    pi.quantity,
                    pi.price,
                    pi.rating,
                    pi.rating_count,
                    c.name as category_name,
                    c.id as category_id,
                    u.id as vendor_id,
                    u.user_name as vendor_user_name,
                    u.first_name as vendor_first_name,
                    u.last_name as vendor_last_name,
                    u.email as vendor_email,
                    v.description as vendor_description,
                    v.rating as vendor_rating,
                    v.rating_count as vendor_rating_count,
                    i.url as vendor_image_url,
                    i.remote_id as vendor_image_id
                FROM
                    product_items pi
                JOIN
                    products p ON pi.product_id = p.id
                JOIN
                    categories c ON p.category_id = c.id
                JOIN
                    vendors v ON pi.vendor_id = v.id
                JOIN
                    users u ON v.user_id = u.id
                JOIN
                    images i ON u.image_id = i.id
                ORDER BY
                    pi."updatedAt" DESC
                LIMIT ${limit}
            `
        );
        productItems = productItems[0];
        productItems = await getItemsImageAndIsFavourite(productItems, req);
    }

    console.log("herllooo");
    return res.status(200).json({
        status: 'success',
        data: {
            count: productItems.length,
            productItems
        }
    });
});


exports.searchByImage = catchAsync(async (req, res, next) => {
    if(!req.file) {
        return next(new AppError('Please upload an image', 400));
    }

    const limit = req.query.limit || 50;
    if(limit > 50)
        limit = 50;
    const image = req.body.image.buffer.toString('base64');
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    const aiData = {
        image_base64: image
    };
    const raw = JSON.stringify(aiData);
    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
    };
    let result;
    try {
        const response = await fetch(`${process.env.AI_URL}/item/image_base64?limit=${limit}`, requestOptions);
        result = await response.json();
    } catch(err)
    {
        console.log("Error happened while searching by image: ", err.message);
        return next(new AppError('Couldn\'t found Items', 500));
    }
    let data = [];
    for(let i = 0; i < result.ids.length; i++) {
        const id = result.ids[i] * 1;
        if(id !== id)
            continue;
        let productItem = await getProductItem(id, req);
        if(productItem)
            data.push(productItem);
    }
    console.log('If Error Message:', result.detail);
    res.status(200).json({
        status: "success",
        data
    });
});