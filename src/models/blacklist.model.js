const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TokenBlacklist = sequelize.define('TokenBlacklist', {
  token: {
    type: DataTypes.STRING(500), 
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'Token is required to blacklist' },
    },
  },
}, {
  timestamps: true,
});

module.exports = TokenBlacklist;
