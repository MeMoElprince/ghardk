const db = require("../config/database");
const Sequelize = require("sequelize");

const Customer = db.define("customers", {
  user_id: {
    type: Sequelize.INTEGER,
    references: {
      model: "users",
      key: "id",
    },
    unique: true,
    allowNull: false,
  },
});

module.exports = Customer;
