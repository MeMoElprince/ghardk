const DB = require("../config/database");
const Sequelize = require("sequelize");

const Variation = DB.define("variations", {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
});


module.exports = Variation;