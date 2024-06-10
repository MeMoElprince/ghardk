const db = require("../config/database");
const Sequelize = require("sequelize");

const Balance = db.define("balances", {
  vendor_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: "vendors",
      key: "id",
    },
  },
  credit: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  pending_credit: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
});

module.exports = Balance;
