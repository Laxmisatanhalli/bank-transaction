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

tokenBlacklistSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 3 })

module.exports = TokenBlacklist;