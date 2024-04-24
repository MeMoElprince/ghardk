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
    allowNull: false,
    validate: {
      len: [4, 32, "Password must be between 4 and 32 characters"],
    },
  },
  password_confirm: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      len: [4, 32, "Password must be between 4 and 32 characters"],
      isSameAsPassword(value) {
        if (value !== this.password) {
          throw new Error("Password and confirm password must be the same");
        }
      },
    },
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
  img: {
    type: Sequelize.STRING,
    defaultValue: 'default.jpg'
  },
  active: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  }
});



// before data being saved encrypt the password
User.beforeSave(async (user) => {
  // hash the password if it has been modified (or is new)
  if (!user.changed("password")) {
    return;
  }
  // generate a salt
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  user.password_confirm = '';
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
