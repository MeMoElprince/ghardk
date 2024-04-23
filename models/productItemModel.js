const db = require("../config/database");
const Sequelize = require("sequelize");

const ProductItem = db.define("product_items", {
  product_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: "products",
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
  quantity: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  price: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
  },
});

ProductItem.associate = (models) => {
  ProductItem.belongsTo(models.Product, {
    foreignKey: "product_id",
    as: "product",
  });
  ProductItem.belongsTo(models.Vendor, {
    foreignKey: "vendor_id",
    as: "vendor",
  });
};

module.exports = ProductItem;
