const mogoose = require('mongoose');

const ledgerSchema = new mogoose.Schema({
  account: {
    type: mogoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: [ true, 'ledger must belong to an account' ],
    index: true,
    immutable: true
  },
  amount: {
    type: Number,
    required: [ true, 'ledger must have an amount' ], 
    immutable: true
  },
  transaction: {
    type: mogoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: [ true, 'ledger must belong to a transaction' ],
    index: true,
    immutable: true
    },
    type: {
      type: String,
      enum: {
        values:[ 'debit','credit' ],
        message: 'type must be debit or credit',
       },
        required: [ true, 'ledger must have a type' ],
        immutable: true
    }
  })

  function preventLedgerModification() {
    throw new Error('Ledger entries cannot be modified or deleted');
  }

  ledgerSchema.pre('findOneAndUpdate', preventLedgerModification);
  ledgerSchema.pre('updateOne', preventLedgerModification);
  ledgerSchema.pre('deleteOne', preventLedgerModification);
  ledgerSchema.pre('remove', preventLedgerModification);
  ledgerSchema.pre('deleteMany', preventLedgerModification);
  ledgerSchema.pre('updateMany', preventLedgerModification);
  ledgerSchema.pre('findOneAndDelete', preventLedgerModification);
  ledgerSchema.pre('findOneAndRemove', preventLedgerModification);

const ledgerModel = mogoose.model('Ledger', ledgerSchema);

module.exports = ledgerModel;