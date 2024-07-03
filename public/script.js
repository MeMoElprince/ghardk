const fs = require('fs');
const path = require('path');
const Product = require('../models/productModel');
const ProductItem = require('../models/productItemModel');
const ProductImage = require('../models/productImageModel');
const Image = require('../models/imageModel');
const User = require('../models/userModel');
const Customer = require('../models/customerModel');
const Vendor = require('../models/vendorModel');
const Balance = require('../models/balanceModel');
const Category = require('../models/categoryModel');


const color = require('../utils/colors');
const fetch = require('node-fetch');
const imageKit = require('imagekit');



const imageKitConfig = new imageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});
const vendorIds = []

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
}


function readProducts() {
    let data = fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8');
    data = JSON.parse(data);
    data = Object.keys(data).map(key => {
        data[key].vendor_id = vendorIds[parseInt(Math.random() * 1000) % (vendorIds.length)];
        data[key].quantity *= 1;
        data[key].price = parseFloat(data[key].price.replace(',', ''));
        data[key].category_id *= 1;
        if(data[key].image.startsWith('//'))
            data[key].image = data[key].image.replace('//', 'https://');
        if(data[key].description.length > 250)
        {
            data[key].description = data[key].description.slice(0, 250) + '...';
        }
        return data[key];
    });
    return data;
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
        let image;
        if(productData.image)
        {
            console.log(color.FgBlue, "Trying to create image for the product", color.Reset);
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
        
        // Uploading product To AI
        // ........................
        try {
            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            const aiData = {
                id: `${productItem.id}`,
                name: product.name,
                description: product.description
            };
            const raw = JSON.stringify(aiData);
            const requestOptions = {
                method: "POST",
                headers: myHeaders,
                body: raw,
                redirect: "follow",
            };
            console.log(color.FgBlue, "Uploading product to AI........", color.Reset);
            const response = await fetch(`${process.env.AI_URL}/item`, requestOptions);
            const result = await response.json();
            console.log(color.FgGreen, "product uploaded to AI successfully........", color.Reset);
        } catch(err)
        {
            console.log(color.FgRed, "Error while uploading product to AI........", color.Reset);
            throw err;
        }

        // Uploading product Image To AI

        try {
            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            const aiData = {
                item_id: `${productItem.id}`,
                image_id: `${image.id}`,
                image_base64: productData.image
            };
            const raw = JSON.stringify(aiData);
            const requestOptions = {
                method: "POST",
                headers: myHeaders,
                body: raw,
                redirect: "follow",
            };
            console.log(color.FgBlue, "Uploading product Image to AI........", color.Reset);
            const response = await fetch(`${process.env.AI_URL}/item/image`, requestOptions);
            const result = await response.json();
            console.log(color.FgGreen, "product Image uploaded to AI successfully........", color.Reset);

        } catch(err)
        {
            console.log(color.FgRed, "Error while uploading product Image to AI........", color.Reset);
            throw err;
        }

    } catch (error) {
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

async function createProducts(data) {
    for (const [index, productData] of data.entries()) {
        if(index > 50)
            break;
        console.log(color.BgCyan, "index: ", index, color.Reset);
        productData.image = await getImageBase64(productData.image);
        await uploadProductToDB(productData);
        console.log(color.BgCyan, "Uploaded product to DB of index: ", index, color.Reset);
    }
}






function readVendors() {
    const data = fs.readFileSync(path.join(__dirname, 'vendors.json'), 'utf8');
    return JSON.parse(data).vendors;
}

async function createUser(userData) {
    try {
        const data = filterObj(userData, 'first_name', 'last_name', 'email', 'password', 'password_confirm', 'role', 'dob', 'gender', 'user_name');
        data.active = 1;

        let newImage;
        try {
            console.log(color.FgBlue, 'Creating image...', color.Reset);
            newImage = await Image.create({
                url: 'https://ik.imagekit.io/nyep6gibl/default.jpg?updatedAt=1718367419170',
            });
            console.log(color.FgGreen, 'Image created successfully.', color.Reset);
        } catch(err) {
            console.log(color.FgRed, 'Image failed to be created', color.Reset);
            throw err;
        }

        data.image_id = newImage.id;

        console.log(color.FgBlue, 'Creating user...', color.Reset);
        let user;
        try {
            user = await User.create(data);
        } catch(err) 
        {
            console.log(color.FgRed, 'Removing Image...', color.Reset);
            await newImage.destroy();
            throw err;
        }

        console.log(color.FgGreen, 'User created successfully.', color.Reset);
        if(data.role === 'vendor') {
            const newData = filterObj(userData, 'national_id', 'description');
            newData.user_id = user.id;
            // create vendor
            console.log(color.FgBlue, 'Creating Vendor...', color.Reset);
            let vendor;
            try{
                vendor = await Vendor.create(newData);  
                console.log(color.FgGreen, 'Vendor created successfully.', color.Reset);
            } catch (err)
            {
                console.log(color.FgRed, 'Removing user...', color.Reset);
                await user.destroy();
                console.log(color.FgRed, 'Removing Image...', color.Reset);
                await newImage.destroy();
                err.message = 'Vendor failed to be created';
                throw err;
            }
    
            // create balance
            console.log(color.FgBlue, 'Creating Balance...', color.Reset);
            let balance;
            try{
                balance = await Balance.create({vendor_id: vendor.id});
                console.log(color.FgGreen, 'Balance created successfully.', color.Reset);
            } catch (err)
            {
                console.log(color.FgRed, 'Removing vendor...', color.Reset);
                await vendor.destroy();
                console.log(color.FgRed, 'Removing user...', color.Reset);
                await user.destroy();
                console.log(color.FgRed, 'Removing Image...', color.Reset);
                await newImage.destroy();
                err.message = 'Balance failed to be created';
                throw err;
            }
            vendorIds.push(vendor.id);
        }
    
        if(data.role === 'customer') {
            const newData = {user_id: user.id};
            console.log(color.FgCyan, 'Creating Customer...', color.Reset);
            let customer;
            try {
                customer = await Customer.create(newData);
                console.log(color.FgGreen, 'Customer created successfully.', color.Reset);
            } catch (err) {
                console.log(color.FgRed, 'Removing user...', color.Reset);
                await user.destroy();
                console.log(color.FgRed, 'Removing Image...', color.Reset);
                await newImage.destroy();
                err.message = 'Customer failed to be created';
                throw err;
            }
    
            // create cart
            console.log(color.FgCyan, 'Creating Cart...', color.Reset);
            try {
                const cart = await Cart.create({customer_id: customer.id});
                console.log(color.FgGreen, 'Cart created successfully.', color.Reset);
            } catch (err) {
                console.log(color.FgRed, 'Removing customer...', color.Reset);
                await customer.destroy();
                console.log(color.FgRed, 'Removing user...', color.Reset);
                await user.destroy();
                console.log(color.FgRed, 'Removing Image...', color.Reset);
                await newImage.destroy();
                err.message = 'Cart failed to be created';
                throw err;
            }
        }
    } catch(err) {
        console.log(color.FgMagenta, "User failed to be created.. : ", err.message, color.Reset);
    }
    
}

async function creatVendors(data) {
    for (const [index, vendorData] of data.entries()) {
        if(index > 10)
            break;
        if(vendorData.role !== 'vendor')
            continue;
        console.log(color.BgCyan, "index: ", index, color.Reset);
        await createUser(vendorData);
        console.log(color.BgCyan, "Uploaded vendor to DB of index: ", index, color.Reset);
    }
}






// 
// category_id={
//     "Accessories" : 1,
//     "candles" : 2,
//     "textiles" : 3,
//     "pottery and ceramic" : 4,
//     "leather" : 5
//   }
async function createCategories() {
    const data = [
        {
            name: "Accessories",
            image: "https://ik.imagekit.io/ncsik7xqy/categories/Accessories.jpg?updatedAt=1719959352513",
            remote_id: "66847f3837b244ef548767e1"
        },
        {
            name: "candles",
            image: "https://ik.imagekit.io/ncsik7xqy/categories/Accessories.jpg?updatedAt=1719959352513",
            remote_id: "66847f3837b244ef548767e1"
        },
        {
            name: "textiles",
            image: "https://ik.imagekit.io/ncsik7xqy/categories/Accessories.jpg?updatedAt=1719959352513",
            remote_id: "66847f3837b244ef548767e1"
        },
        {
            name: "pottery and ceramic",
            image: "https://ik.imagekit.io/ncsik7xqy/categories/Potary%20and%20ceramic.jpg?updatedAt=1719959348411",
            remote_id: "66847f3437b244ef5487590a",
        },
        {
            name: "leather",
            image: "https://ik.imagekit.io/ncsik7xqy/categories/Accessories.jpg?updatedAt=1719959352513",
            remote_id: "66847f3837b244ef548767e1"
        }
    ]
    for(const category of data) {
        try {
            console.log(color.FgBlue, "Creating image for category", color.Reset)
            const image = await Image.create({url: category.image, remote_id: category.remote_id});
            console.log(color.FgGreen, "Image created successfully", color.Reset);
            try {
                console.log(color.FgBlue, "Creating category", color.Reset);
                await Category.create({
                    name: category.name,
                    image_id: image.id
                });
                console.log(color.FgGreen, "Category created successfully", color.Reset);
            } catch(err)
            {
                console.log(color.FgRed, "Error while creating category", color.Reset);
                console.log(color.FgBlue, "Removing image", color.Reset);
                await image.destroy();
                throw err;
            }
            console.log(color.BgGreen, "Category created successfully", color.Reset);
        } catch (error) {
            console.log(color.FgMagenta, "Error while creating category", color.Reset);
            throw error;
        }
    }
}



(async function start() {
    // If there is a category comment the below line
    await createCategories();
    const vendors = readVendors();
    await creatVendors(vendors);
    const products = readProducts();
    await createProducts(products);
})();