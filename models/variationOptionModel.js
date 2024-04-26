const DB = require("../config/database");
const Sequelize = require("sequelize");

const VariationOption = DB.define("variation_options", {
  value: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  variation_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'variations',
      key: 'id'
    },
  },
});

module.exports = VariationOption;