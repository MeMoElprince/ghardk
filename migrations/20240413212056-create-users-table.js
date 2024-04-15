'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      first_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: Sequelize.STRING,
        validate: {
          len: [4, 32, 'Password must be between 4 and 32 characters']
        }
      },
      password_confirm: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          len: [4, 32, 'Password must be between 4 and 32 characters'],
          isSameAsPassword (value) {
            if (value !== this.password) {
              throw new Error('Password and confirm password must be the same');
            }
          }
        }
      },
      role: {
        type: Sequelize.ENUM('customer', 'admin', 'vendor'),
        defaultValue: 'customer'
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      dob: {
        type: Sequelize.DATE
      },
      gender: {
        type: Sequelize.ENUM('male', 'female', 'not specified'),
        defaultValue: 'not specified'
      },
      language_preference: {
        type: Sequelize.STRING,
        defaultValue: 'en'
      },
      password_changed_at: {
        type: Sequelize.DATE
      },
      secret_token: {
        type: Sequelize.STRING
      },
      secret_token_expires_at: {
        type: Sequelize.DATE
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
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};
