const db = require("../config/database");
const Sequelize = require("sequelize");

const Sale = db.define("sales", {
  customer_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: "customers",
      key: "id",
    },
  },
  transaction_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: "transactions",
      key: "id",
    },
  },
  vendor_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: "vendors",
      key: "id",
    },
  },
  total_price: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: Sequelize.ENUM("pending", "success", "cancelled"),
    allowNull: false,
    defaultValue: "pending",
  },
  address_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: "addresses",
      key: "id",
    },
  },
  intent_id: {
    type: Sequelize.STRING,
    allowNull: false,
  },
});


module.exports = Sale;