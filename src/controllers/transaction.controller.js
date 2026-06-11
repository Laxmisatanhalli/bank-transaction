const transactionModel = require('../models/transaction.model');
const ledgerModel = require('../models/ledger.model');
const accountModel = require('../models/account.model');
const emailService = require('../services/email.service');



/**
 * - Create a new transaction
 * THE 10-STEP TRANSFER FLOW:
 * 1. Validate request
 * 2. Validate idempotency key
 * 3. Check account status
 * 4. Derive sender balance from Ledger
 * 5. Create transaction (PENDING)
 * 6. Create DEBIT ledger entry
 * 7. Create CREDIT ledger entry
 * 8. Mark transaction COMPLETED
 * 9. Commit MongoDB session
 * 10. Send email notification
 */


async function createTransaction(req, res) {

  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

  /** 1. Validate request */
  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({ 
      message: 'Missing required fields'
     });
  }

  const fromAccount = await accountModel.findOne({ 
    _id: fromAccount, 
  })

  const toAccount = await accountModel.findOne({
    _id: toAccount, 
    })

    if (!fromAccount || !toAccount) {
      return res.status(400).json({ 
        message: 'Invalid fromAccount or toAccount' 
      });
    }

    /** 2. Validate idempotency key */
    const isTransactionAlreadyExists = await transactionModel.findOne({
      idempotencyKey: idempotencyKey
    })

    if(isTransactionAlreadyExists){
      if(isTransactionAlreadyExists.status === 'COMPLETED') {
      return res.status(200).json({
        message: 'Transaction already processed',
        transaction: isTransactionAlreadyExists
       })
      }
      if(isTransactionAlreadyExists.status === 'PENDING') {
        return res.status(200).json({
          message: 'Transaction is pending',
          transaction: isTransactionAlreadyExists
         })
      }
      if(isTransactionAlreadyExists.status === 'FAILED') {
        return res.status(500).json({
          message: 'Transaction already failed, please retry'
          })
      }
      if(isTransactionAlreadyExists.status === 'REVERSED') {
        return res.status(500).json({
        message: 'Transaction already reversed, please retry'
        })
      }

  }

  /** 3. Check account status */
  if(fromAccount.status !== 'ACTIVE' || toAccount.status !== 'ACTIVE') {
    return res.status(400).json({ 
      message: 'Both accounts must be active to process transaction' 
    });
  }

  /** 4. Derive sender balance from Ledger */
  


}