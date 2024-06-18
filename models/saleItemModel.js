const db = require("../config/database");
const Sequelize = require("sequelize");

const SaleItem = db.define("sales_items", {
  sale_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: "sales",
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
  quantity: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
});

module.exports = SaleItem;