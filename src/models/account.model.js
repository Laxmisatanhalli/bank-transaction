const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Account = sequelize.define('Account', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: { msg: 'account must belong to a user' },
    },
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'FROZEN', 'CLOSED'),
    defaultValue: 'ACTIVE',
    validate: {
      isIn: {
        args: [['ACTIVE', 'FROZEN', 'CLOSED']],
        msg: 'status must be ACTIVE, FROZEN or CLOSED',
      },
    },
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'INR',
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId', 'status'] }, // matches accountSchema.index({ user: 1, status: 1 })
  ],
});

// add this to account.model.js, before module.exports

Account.prototype.getBalance = async function () {
  const Ledger = require('./ledger.model'); // required inline to avoid circular import issues

  const credits = await Ledger.sum('amount', {
    where: { accountId: this.id, type: 'credit' },
  }) || 0;

  const debits = await Ledger.sum('amount', {
    where: { accountId: this.id, type: 'debit' },
  }) || 0;

  return credits - debits;
};


module.exports = Account;