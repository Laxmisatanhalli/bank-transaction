const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Ledger = sequelize.define('Ledger', {
  accountId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: { msg: 'ledger must belong to an account' },
    },
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2), // better than FLOAT for money — avoids rounding errors
    allowNull: false,
    validate: {
      notNull: { msg: 'ledger must have an amount' },
    },
  },
  transactionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: { msg: 'ledger must belong to a transaction' },
    },
  },
  type: {
    type: DataTypes.ENUM('debit', 'credit'),
    allowNull: false,
    validate: {
      isIn: {
        args: [['debit', 'credit']],
        msg: 'type must be debit or credit',
      },
    },
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['accountId'] },
    { fields: ['transactionId'] },
  ],
  hooks: {
    beforeUpdate: () => {
      throw new Error('Ledger entries cannot be modified or deleted');
    },
    beforeDestroy: () => {
      throw new Error('Ledger entries cannot be modified or deleted');
    },
    beforeBulkUpdate: () => {
      throw new Error('Ledger entries cannot be modified or deleted');
    },
    beforeBulkDestroy: () => {
      throw new Error('Ledger entries cannot be modified or deleted');
    },
  },
});

module.exports = Ledger;