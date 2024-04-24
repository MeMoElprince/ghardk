const db = require("../config/database");
const Sequelize = require("sequelize");
const AppError = require('../utils/AppError');
const color = require('../utils/colors');

const UserAddress = db.define("user_addresses", {
  user_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: "users",
      key: "id",
    },
  },
  address_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: "addresses",
      key: "id",
    },
  },
  is_default: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

// check if there is a user_id with is_default = true

UserAddress.beforeSave(async (userAddress) => {
    // check if there is a user_id with is_default = true
    if(userAddress.is_default === true)
    {
        const userAddressExists = await UserAddress.findOne({
          where: {
            user_id: userAddress.user_id,
            is_default: true,
          },
        });
        if (userAddressExists) {
            console.log(color.FgBlue, 'You should see the error not something verywrong in production', color.Reset);
            throw new AppError("User already has a default address", 400);
        }
    }
}); 

module.exports = UserAddress;
