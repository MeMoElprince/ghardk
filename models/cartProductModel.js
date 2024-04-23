const db = require("../config/database");
const Sequelize = require("sequelize");

const CartProduct = db.define("cart_products", {
  product_item_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: "product_items",
      key: "id",
    },
  },
  cart_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: "carts",
      key: "id",
    },
  },
  quantity: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  price: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
  },
});

module.exports = CartProduct;
