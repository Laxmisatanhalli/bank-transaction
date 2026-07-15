const User = require('./user.model');
const Account = require('./account.model');
const Transaction = require('./transaction.model');
const Ledger = require('./ledger.model');

// User <-> Account
User.hasMany(Account, { foreignKey: 'userId' });
Account.belongsTo(User, { foreignKey: 'userId' });

// Account <-> Transaction (two foreign keys to same table, needs aliases)
Account.hasMany(Transaction, { foreignKey: 'fromAccountId', as: 'sentTransactions' });
Account.hasMany(Transaction, { foreignKey: 'toAccountId', as: 'receivedTransactions' });
Transaction.belongsTo(Account, { foreignKey: 'fromAccountId', as: 'fromAccount' });
Transaction.belongsTo(Account, { foreignKey: 'toAccountId', as: 'toAccount' });

// Account <-> Ledger
Account.hasMany(Ledger, { foreignKey: 'accountId' });
Ledger.belongsTo(Account, { foreignKey: 'accountId' });

// Transaction <-> Ledger
Transaction.hasMany(Ledger, { foreignKey: 'transactionId' });
Ledger.belongsTo(Transaction, { foreignKey: 'transactionId' });

module.exports = { User, Account, Transaction, Ledger };