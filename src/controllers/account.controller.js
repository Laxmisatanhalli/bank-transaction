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

module.exports = { createAccountController };