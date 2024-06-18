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
    if(userAddress.is_default === true){
        const userAddresse = await UserAddress.findOne({
            where: {
                id: {
                    [Sequelize.Op.ne]: userAddress.id
                },
                is_default: true
            }
        });
        if(userAddresse){
            userAddresse.is_default = false;
            userAddresse.save();
        }
    }
    else
    {
       const userAddresse = await UserAddress.findOne({
            where: {
                id: {
                  // not equal to the current id
                    [Sequelize.Op.ne]: userAddress.id
                },
                is_default: true
            }
        });
        if(!userAddresse){
            userAddress.is_default = true;
        }
    }
}); 

module.exports = UserAddress;
