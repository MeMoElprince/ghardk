const db = require("../config/database");
const Sequelize = require("sequelize");

const Address = db.define("addresses", {
  street_name: {
    type: Sequelize.STRING(100),
    allowNull: false,
  },
  city: {
    type: Sequelize.STRING(100),
    allowNull: false,
  },
  description: {
    type: Sequelize.STRING(255),
    allowNull: false,
  },
  postal_code: {
    type: Sequelize.STRING(10),
    allowNull: false,
  },
  country_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: "countries",
      key: "id",
    },
  },
});

module.exports = Address;
