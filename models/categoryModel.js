const db = require("../config/database");
const Sequelize = require("sequelize");

const Category = db.define("categories", {
  name: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false
  },
  parent_category_id: {
    type: Sequelize.INTEGER,
    references: {
      model: "categories",
      key: "id",
    },
  },
});

module.exports = Category;
