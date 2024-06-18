const db = require('../config/database');
const Sequelize = require('sequelize');

const Transaction = db.define('transaction', {
    status: {
      type: Sequelize.ENUM('pending', 'success', 'cancelled', 'refunded'),
      allowNull: false,
      defaultValue: 'pending'
    },
  });

module.exports = Transaction;