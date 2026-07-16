const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'name is required' },
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'email is required' },
      isEmail: { msg: 'Please enter a valid email address' },
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'password is required' },
      len: { args: [6, 100], msg: 'password must be at least 6 characters long' },
    },
  },
  systemUser: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    immutable: true,
    select: false
  },
}, {
  timestamps: true,

  // <-- HERE, inside the options object:
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
  },

  defaultScope: {
    attributes: { exclude: ['password', 'systemUser'] },
  },
  scopes: {
    withPassword: {
      attributes: {},
    },
  },
});

User.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;