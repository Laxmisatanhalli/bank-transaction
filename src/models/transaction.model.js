const mongoose = require('mongoose');
const { isValidElement } = require('react');

const transactionSchema = new mongoose.Schema({
  fromAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: [ true, 'transaction must belong to an account' ],
    index: true
  },
  toAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: [ true, 'transaction must belong to an account' ],
    index: true
  },
  status: {
    type: String,
    enum: {
      values:[ 'pending','completed', 'failed', 'reversed' ],
      message: 'status must be pending, completed, failed or reversed',
     },
      default: 'pending'
  },
  amount: {
    type: Number,
    required: [ true, 'transaction must have an amount' ],
    min: [ 0, 'transaction amount cannot be negative' ]
  },
  idempotencyKey: {
    type: String,
    required: [ true, 'transaction must have an idempotency key' ],
    index: true,
    unique: true
  }


},{
  timestamps: true
})

const transactionModel = mongoose.model('Transaction', transactionSchema);

module.exports = transactionModel;
