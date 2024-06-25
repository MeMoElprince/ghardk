'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    
    await queryInterface.addColumn('categories', 'image_id', {
      type: Sequelize.INTEGER,
      references: { model: 'images', key: 'id' },
    });

  },  

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('categories', 'image_id');
  }
};
