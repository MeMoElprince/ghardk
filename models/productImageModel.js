const DB = require('../config/database');
const Sequelize = require('sequelize');


const productImage = DB.define('product_image', {
    product_item_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'product_items',
            key: 'id'
        }
    },
    image_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'images',
            key: 'id'
        }
    }
});

module.exports = productImage;