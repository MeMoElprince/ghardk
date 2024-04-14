const db = require("../config/database");
const sequelize = require("sequelize");

const User = db.define("users", {
  first_name: {
    type: sequelize.STRING,
    allowNull: false,
  },
  last_name: {
    type: sequelize.STRING,
  },
  email: {
    type: sequelize.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: sequelize.STRING,
    allowNull: false,
    validate: {
      len: [4, 32],
    },
  },
  role: {
    type: sequelize.ENUM("customer", "admin", "vendor"),
    defaultValue: "customer",
  },
  createdAt: {
    type: sequelize.DATE,
    defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
  },
  updatedAt: {
    type: sequelize.DATE,
    defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
  },
  dob: {
    type: sequelize.DATE,
  },
  gender: {
    type: sequelize.ENUM("male", "female", "not specified"),
    defaultValue: "not specified",
  },
  language_preference: {
    type: sequelize.STRING,
    defaultValue: "en",
  },
});


module.exports = User;