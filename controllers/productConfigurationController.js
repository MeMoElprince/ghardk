const ProductConfiguration = require("../models/productConfigurationModel");
const crudFactory = require('./crudFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const db = require('../config/database');



exports.getAllProductConfigurations = crudFactory.getAll(ProductConfiguration);
exports.createProductConfiguration = crudFactory.createOne(ProductConfiguration, 'product_item_id', 'variation_option_id');
exports.updateProductConfiguration = crudFactory.updateOne(ProductConfiguration, 'product_item_id', 'variation_option_id');
exports.deleteProductConfiguration = crudFactory.deleteOne(ProductConfiguration);


exports.getAllConfigurationsByProduct = catchAsync(async (req, res, next) => {

    const product_item_id = req.params.productId;
    if(!product_item_id)
        return next();
    const limit = req.query.limit * 1 || 100;
    if(limit > 100) {
        limit = 100;
    }
    const page = req.query.page * 1 || 1;
    const offset = (page - 1) * limit;


    let productConfigurations = await db.query(
        `
            SELECT 
                pc.id, 
                p.name AS product_name,
                vo.value,
                v.name 
            FROM 
                product_configurations pc
            JOIN
                variation_options vo ON pc.variation_option_id = vo.id
            JOIN
                variations v ON vo.variation_id = v.id
            JOIN
                product_items pi ON pc.product_item_id = pi.id
            JOIN
                products p ON pi.product_id = p.id
            WHERE
                pc.product_item_id = ${product_item_id}
        `
    );

    productConfigurations = productConfigurations[0];

    console.log(productConfigurations);

    let result = {
    };

    for(let i = 0; i < productConfigurations.length; i++)
    {
        if(!result[productConfigurations[i].name])
            result[productConfigurations[i].name] = {value: []};
        result[productConfigurations[i].name].name = productConfigurations[i].name;
        result[productConfigurations[i].name].product_name = productConfigurations[i].poduct_name;
        result[productConfigurations[i].name].id = productConfigurations[i].id;
        result[productConfigurations[i].name].value.push(productConfigurations[i].value);
    }

    res.status(200).json({
        status: "success",
        data: {
            count: productConfigurations.length,
            configurations: result
        }
    });
});