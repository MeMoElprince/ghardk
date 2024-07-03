const Sequelize = require('sequelize');

require('dotenv').config({ path: './config.env' });
const config = require('./config')[process.env.NODE_ENV || 'development'];
const sequelize = new Sequelize(config.database, config.username, config.password, config);

module.exports = sequelize;
