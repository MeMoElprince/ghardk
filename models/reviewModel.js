const db = require("../config/database");
const Sequelize = require("sequelize");

const Review = db.define("reviews", {
  rating: {
    type: Sequelize.DataTypes.INTEGER,
    allowNull: false,
  },
  comment: {
    type: Sequelize.DataTypes.TEXT,
    allowNull: false,
  },
  sale_item_id: {
    type: Sequelize.DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "sales_items",
      key: "id",
    },
  },
  customer_id: {
    type: Sequelize.DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "customers",
      key: "id",
    },
  },
  status: {
    type: Sequelize.DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending'
  },
});


module.exports = Review;
