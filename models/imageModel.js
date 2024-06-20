const db = require('../config/database');
const Sequelize = require('sequelize');

const Image = db.define('image', {
    url: {
        type: Sequelize.STRING,
        allowNull: false
    },
    remote_id: {
        type: Sequelize.STRING,
    }
});

module.exports = Image;