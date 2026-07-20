const { Account } = require('../models/index');

async function createAccountController (req, res) {
  try {
    const user = req.user;

    const account = await Account.create({
      userId: user.id
    });

    res.status(201).json({
      message: 'Account created successfully', account 
    });
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ message: 'Something went wrong', status: 'failed' });
  }
}

async function getUserAccountsController(req, res) {

  const accounts = await Account.findAll({
    where: { userId: req.user.id }

    
  });
  res.status(200).json({ accounts });
}


async function getAccountBalanceController(req, res) {
  const accountId = req.params.accountId;

  const account = await Account.findOne({
    where: { id: accountId, userId: req.user.id }
  });

  if (!account) {
    return res.status(404).json({ message: 'Account not found' });
  }

  const balance = await account.getBalance();
console.log('DEBUG balance:', balance);
  res.status(200).json({
    accountId: account.id,
    balance: balance
  });
}

module.exports = { createAccountController, getUserAccountsController,getAccountBalanceController };