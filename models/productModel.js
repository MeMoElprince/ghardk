const db = require("../config/database");
const Sequelize = require("sequelize");

const Product = db.define("products", {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  description: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  category_id: {
    type: Sequelize.INTEGER,
    references: {
      model: "categories",
      key: "id",
    },
  }
});

Product.associate = (models) => {
  Product.belongsTo(models.Category, {
    foreignKey: "category_id",
    as: "category",
  });
  Product.hasMany(models.ProductItem, {
    foreignKey: "product_id",
    as: "productItems",
  });
}

module.exports = Product;
