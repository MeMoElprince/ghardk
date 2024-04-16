const db = require("../config/database");
const Sequelize = require("sequelize");

const Cart = db.define("carts", {
  customer_id: {
    type: Sequelize.INTEGER,
    unique: true,
    allowNull: false,
    references: {
      model: "customers",
      key: "id",
    },
  },
});

module.exports = Cart;
