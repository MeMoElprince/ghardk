const db = require("../config/database");
const Sequelize = require("sequelize");
const bcrypt = require("bcryptjs");
const crypto = require('crypto');

const User = db.define("users", {
  first_name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  last_name: {
    type: Sequelize.STRING,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  },
  password_confirm: {
    type: Sequelize.STRING,
    allowNull: false
  },
  role: {
    type: Sequelize.ENUM("customer", "admin", "vendor"),
    defaultValue: "customer",
  },
  createdAt: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
  },
  updatedAt: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
  },
  dob: {
    type: Sequelize.DATE,
  },
  gender: {
    type: Sequelize.ENUM("male", "female", "not specified"),
    defaultValue: "not specified",
  },
  language_preference: {
    type: Sequelize.STRING,
    defaultValue: "en",
  },
  password_changed_at: {
    type: Sequelize.DATE,
  },
  secret_token: {
    type: Sequelize.STRING,
  },
  secret_token_expires_at: {
    type: Sequelize.DATE,
  },
  active: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  user_name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  image_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'images',
      key: 'id'
    }
  }
});



// before data being saved encrypt the password
// this function is called before the data is saved and after the data is validated



User.beforeSave('save', async (user) => {
  // hash the password if it has been modified (or is new)
  if (!user.changed("password")) {
    return;
  }
  if(user.password !== user.password_confirm)
    throw new Error("password and confirm password do not match");
  if(user.password.length < 4)
    throw new Error("password must be atleast 4 characters long");
  // generate a salt
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  user.password_confirm = '';
  user.password_changed_at = Date.now() - 1000;
});

// User.beforeSave(async (user) => {
//   // password Changed At 
//   if(!user.changed("password") || user.isNew("password"))
//     return;
//   user.password_changed_at = Date.now() - 1000;
// });

// create a secret token in a method
User.prototype.createSecretToken = function () {
  const secret_token = crypto.randomBytes(3).toString("hex");
  this.secret_token = crypto.createHash("sha256").update(secret_token).digest("hex");
  this.secret_token_expires_at = Date.now() + 10 * 60 * 1000;
  return secret_token;
};

User.prototype.validatePassword = function (candidatePassword) {
  const password = this.password;
  return bcrypt.compare(candidatePassword, password);
}
module.exports = User;
