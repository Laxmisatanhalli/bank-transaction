const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Transaction = sequelize.define('Transaction', {
  fromAccountId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: { msg: 'transaction must belong to an account' },
    },
  },
  toAccountId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: { msg: 'transaction must belong to an account' },
    },
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED', 'REVERSED'),
    defaultValue: 'PENDING',
    validate: {
      isIn: {
        args: [['PENDING', 'COMPLETED', 'FAILED', 'REVERSED']],
        msg: 'status must be PENDING, COMPLETED, FAILED or REVERSED',
      },
    },
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2), // same reasoning as Ledger — avoids float rounding errors
    allowNull: false,
    validate: {
      notNull: { msg: 'transaction must have an amount' },
      min: { args: [0], msg: 'transaction amount cannot be negative' },
    },
  },
  idempotencyKey: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notNull: { msg: 'transaction must have an idempotency key' },
    },
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['fromAccountId'] },
    { fields: ['toAccountId'] },
    // idempotencyKey already gets an index automatically from unique: true
  ],
});

module.exports = Transaction;