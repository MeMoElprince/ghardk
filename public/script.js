const fs = require('fs');
const path = require('path');
const Product = require('../models/productModel');
const ProductItem = require('../models/productItemModel');
const ProductImage = require('../models/productImageModel');
const Image = require('../models/imageModel');
const color = require('../utils/colors');
const fetch = require('node-fetch');
const imageKit = require('imagekit');



const imageKitConfig = new imageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

const vendorIds = [1, 2, 3, 4, 5]

let data = fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8');
data = JSON.parse(data);

data = Object.keys(data).map(key => {
    data[key].vendor_id = vendorIds[parseInt(Math.random() * 1000) % (vendorIds.length)];
    data[key].quantity *= 1;
    data[key].price = parseFloat(data[key].price.replace(',', ''));
    data[key].category_id *= 1;
    data[key].image = data[key].image.replace('//', 'https://');
    if(data[key].description.length > 250)
    {
        data[key].description = data[key].description.slice(0, 250) + '...';
    }
    return data[key];
});


// console.log(data);



const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
}






async function uploadProductToDB(productData) {
    try { 
        console.log(color.FgBlue, "Trying to create product", color.Reset);
        const data1 = filterObj(productData, 'name', 'description','category_id');
        const product = await Product.create(data1);
        console.log(color.FgGreen, "Product created successfully", color.Reset);

        const data2 = filterObj(productData, 'quantity', 'price', 'vendor_id');
        data2.product_id = product.id;
        let productItem;
        try {
            console.log(color.FgBlue, "Trying to create product item", color.Reset);
            productItem = await ProductItem.create(data2);
            console.log(color.FgGreen, "Product Item created successfully", color.Reset);
        } catch (error)
        {
            console.log(color.FgRed, "Error while creating product item", color.Reset);
            console.log(color.FgBlue, "Removing Product", color.Reset);
            await product.destroy();
            console.log(color.FgGreen, "Product removed", color.Reset);
            throw error;
        }
        // upload image and create image schema
        // ....................................
        if(productData.image)
        {
            console.log(color.FgBlue, "Trying to create image for the product", color.Reset);
            let image;
            let response;
            try {
                console.log(color.FgBlue, "Trying to upload image to imageKit", color.Reset);
                response = await imageKitConfig.upload({
                    file: productData.image,
                    fileName: productData.name + '.jpg',
                    folder: '/productImages'
                });
            } catch(error)
            {
                console.log(color.FgRed, "Error while uploading image to imageKit", color.Reset);
                console.log(color.FgBlue, "Removing Product Item", color.Reset);
                await productItem.destroy();
                console.log(color.FgGreen, "Product Item removed", color.Reset);
                console.log(color.FgBlue, "Removing Product", color.Reset);
                await product.destroy();
                console.log(color.FgGreen, "Product removed", color.Reset);
                throw error;
            }


            try {
                console.log(color.FgBlue, "Trying to create image table", color.Reset);
                image = await Image.create({url: response.url, remote_id: response.fileId});
                console.log(color.FgGreen, "Image table created successfully", color.Reset);
            } catch (error) {
                console.log(color.FgRed, "Error while creating image table", color.Reset);
                console.log(color.FgBlue, "Removing Product Item", color.Reset);
                await productItem.destroy();
                console.log(color.FgGreen, "Product Item removed", color.Reset);
                console.log(color.FgBlue, "Removing Product", color.Reset);
                await product.destroy();
                console.log(color.FgGreen, "Product removed", color.Reset);
                console.log(color.FgBlue, "Deleting image from imageKit", color.Reset);
                await imageKitConfig.deleteFile(response.fileId);
                console.log(color.FgGreen, "Image deleted successfully", color.Reset);
                throw error;
            }

            try {
                console.log(color.FgBlue, "Trying to create product image", color.Reset);
                const productImage = await ProductImage.create({product_item_id: productItem.id, image_id: image.id});
                console.log(color.FgGreen, "Product Image created successfully", color.Reset);
            } catch (error) {
                console.log(color.FgRed, "Error while creating product image", color.Reset);
                console.log(color.FgBlue, "Deleting image from imageKit", color.Reset);
                await imageKitConfig.deleteFile(response.fileId);
                console.log(color.FgGreen, "Image deleted successfully", color.Reset);
                console.log(color.FgBlue, "Removing Image", color.Reset);
                await image.destroy();
                console.log(color.FgBlue, "Removing Product Item", color.Reset);
                await productItem.destroy();
                console.log(color.FgGreen, "Product Item removed", color.Reset);
                console.log(color.FgBlue, "Removing Product", color.Reset);
                await product.destroy();
                console.log(color.FgGreen, "Product removed", color.Reset);
                throw error;
            }
        }

    } catch (error) {
        console.log(productData);
        console.log(color.FgMagenta, error.message, color.Reset);
    }
};

async function getImageBase64(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const buffer = await response.arrayBuffer();
        const base64String = Buffer.from(buffer).toString('base64');
        return base64String;
    } catch (error) {
        console.error(color.FgRed, 'Error fetching image:', error.message, color.Reset);
    }
}

async function start() {
    for (const [index, productData] of data.entries()) {
        console.log(color.BgCyan, "index: ", index, color.Reset);
        productData.image = await getImageBase64(productData.image);
        await uploadProductToDB(productData);
        console.log(color.BgCyan, "Uploaded product to DB of index: ", index, color.Reset);
    }
}

start();