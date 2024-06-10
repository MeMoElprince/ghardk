const db = require("../config/database");
const Sequelize = require("sequelize");

const FavouriteProduct = db.define("favourite_products", {
  customer_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: "customers",
      key: "id",
    },
  },
  product_item_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: "product_items",
      key: "id",
    },
  },
});

module.exports = FavouriteProduct;
