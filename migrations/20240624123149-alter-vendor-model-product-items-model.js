'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {

      await queryInterface.addColumn('vendors', 'rating', {
          type: Sequelize.FLOAT,
          defaultValue: 0
      });

      await queryInterface.addColumn('vendors', 'rating_count', {
          type: Sequelize.INTEGER,
          defaultValue: 0
      });

      await queryInterface.addColumn('vendors', 'description', {
          type: Sequelize.STRING
      });

      await queryInterface.addColumn('product_items', 'rating', {
        type: Sequelize.FLOAT,
        defaultValue: 0
      });

      await queryInterface.addColumn('product_items', 'rating_count', {
          type: Sequelize.INTEGER,
          defaultValue: 0
      });

  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('product_items', 'rating_count');
    await queryInterface.removeColumn('product_items', 'rating');
    await queryInterface.removeColumn('vendors', 'description');
    await queryInterface.removeColumn('vendors', 'rating_count');
    await queryInterface.removeColumn('vendors', 'rating');
  }
};
