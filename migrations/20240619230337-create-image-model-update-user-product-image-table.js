'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {

    await queryInterface.createTable('images', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      url: {
        type: Sequelize.STRING,
        allowNull: false
      },
      remote_id: {
        type: Sequelize.STRING,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
    await queryInterface.addColumn('users', 'image_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'images',
        key: 'id'
      }
    });
    await queryInterface.addColumn('users', 'user_name', {
      type: Sequelize.STRING,
      allowNull: false
    });
    await queryInterface.removeColumn('users', 'img');
    // table product_images delete column value and replcae it with image_id
    await queryInterface.removeColumn('product_images', 'value');
    await queryInterface.addColumn('product_images', 'image_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'images',
        key: 'id'
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('product_images', 'image_id');
    await queryInterface.addColumn('product_images', 'value', {
      type: Sequelize.STRING,
      allowNull: false
    });
    await queryInterface.addColumn('users', 'img', {
      type: Sequelize.STRING,
      allowNull: false
    });
    await queryInterface.removeColumn('users', 'user_name');
    await queryInterface.removeColumn('users', 'image_id');
    await queryInterface.dropTable('images');
  }
};
