'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    

    await queryInterface.createTable('variations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.createTable('variation_options', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      value: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      variation_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'variations',
          key: 'id'
        },
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.createTable('product_configurations', {
      id:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      product_item_id:{
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'product_items',
          key: 'id'
        }
      },
      variation_option_id:{
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'variation_options',
          key: 'id'
        }
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addConstraint('product_configurations', {
      type: 'unique',
      fields: ['product_item_id', 'variation_option_id'],
      name: 'unique_product_configuration'
    });

  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('product_configurations')
    await queryInterface.dropTable('variation_options');
    await queryInterface.dropTable('variations');
  }
};
