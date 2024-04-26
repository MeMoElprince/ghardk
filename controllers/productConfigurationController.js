const ProductConfiguration = require("../models/productConfigurationModel");
const crudFactory = require('./crudFactory');



exports.getAllProductConfigurations = crudFactory.getAll(ProductConfiguration);
exports.createProductConfiguration = crudFactory.createOne(ProductConfiguration, 'product_item_id', 'variation_option_id');
exports.updateProductConfiguration = crudFactory.updateOne(ProductConfiguration, 'product_item_id', 'variation_option_id');
exports.deleteProductConfiguration = crudFactory.deleteOne(ProductConfiguration);


