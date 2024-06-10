const db = require("../config/database");
const Sequelize = require("sequelize");

const Notification = db.define("notifications", {
  title: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  message: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  type: {
    type: Sequelize.ENUM("balance", "favourite_products"),
    allowNull: false,
  },
  user_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: "users",
      key: "id",
    },
  },
  read: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = Notification;
