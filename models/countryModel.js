const db = require('../config/database');
const Sequelize = require('sequelize');


const Country = db.define('countries', {
    name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
    code: {
    type: Sequelize.STRING(2),
    allowNull: false
    },
});

module.exports = Country;





