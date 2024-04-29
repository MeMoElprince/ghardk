const DB = require('../config/database');
const Sequelize = require('sequelize');


const keyword = DB.define('keyword', {
    product_item_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
        model: 'product_items',
        key: 'id'
        }
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

module.exports = keyword;