const DB = require("../config/database");
const Sequelize = require("sequelize");

const ProductConfiguration = DB.define("product_configurations", {
  product_item_id:{
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'product_items',
      key: 'id'
    }
  },
  variation_option_id:{
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'variation_options',
      key: 'id'
    }
  },
});

module.exports = ProductConfiguration;