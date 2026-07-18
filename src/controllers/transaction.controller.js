const transactionModel = require('../models/transaction.model');
const ledgerModel = require('../models/ledger.model');
const accountModel = require('../models/account.model');
const emailService = require('../services/email.service');
const { sequelize } = require('../config/db'); // changed: mongoose -> sequelize instance

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
 * 9. Commit transaction
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

  const fromUserAccount = await accountModel.findOne({ 
    where: { id: fromAccount } // changed: _id -> where: { id }
  })

  const toUserAccount = await accountModel.findOne({
    where: { id: toAccount } // changed: _id -> where: { id }
    })

    if (!fromUserAccount || !toUserAccount) {
      return res.status(400).json({ 
        message: 'Invalid fromAccount or toAccount' 
      });
    }

    /** 2. Validate idempotency key */
    const isTransactionAlreadyExists = await transactionModel.findOne({
      where: { idempotencyKey } // changed: added where wrapper
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
  if(fromUserAccount.status !== 'ACTIVE' || toUserAccount.status !== 'ACTIVE') {
    return res.status(400).json({ 
      message: 'Both accounts must be active to process transaction' 
    });
  }

  /** 4. Derive sender balance from Ledger */
   const balance = await fromUserAccount.getBalance();

   if (balance < amount) {
    return res.status(400).json({ 
      message: `Insufficient balance. current balance is ${balance}`
    });
   }

   let transaction;
   try{

   /** 5. Create transaction (PENDING) */
   const session = await sequelize.transaction(); // changed: mongoose session -> sequelize transaction
 


  transaction = (await transactionModel.create([{
    fromAccountId: fromAccount,
    toAccountId: toAccount, 
    amount,
    idempotencyKey,
    status: 'PENDING'
  }], { transaction: session })); // changed: session -> transaction: session

  const debitLedgerEntry = await ledgerModel.create({
    accountId: fromAccount, 
    amount: amount,
    transactionId: transaction.id, 
    type: 'debit'
  }, { transaction: session });

  await (()=>{
    return new Promise((resolve) => setTimeout(resolve, 100 * 1000)); // simulate a delay of 100 seconds
       
  })()


  const creditLedgerEntry = await ledgerModel.create({
    accountId: toAccount, 
    amount: amount,
    transactionId: transaction.id, 
    type: 'credit'
  }, { transaction: session });

  /** 8. Mark transaction COMPLETED */
  await transactionModel.update(
    { status: 'COMPLETED' },
    { where: { id: transaction.id }, transaction: session }
  );

  await session.commit(); // changed: session.commitTransaction() -> session.commit()
} catch (error) {
  return res.status(500).json({ message: 'Transaction is pending due to an error, please retry after some time' });
}

  /** 10. Send email notification */

  await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount);

  res.status(201).json({
    message: 'Transaction completed successfully',
    transaction
  });

  } 


async function createInitialFundsTransaction(req, res) {
  const { toAccount, amount, idempotencyKey } = req.body;

  if (!toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({ 
      message: 'Missing required fields'
     });
  }

  const toUserAccount = await accountModel.findOne({
    where: { id: toAccount }
  });

  if (!toUserAccount) {
    return res.status(404).json({ message: 'Invalid toAccount' });
  }

  const fromUserAccount = await accountModel.findOne({ 
    where: { userId: req.user.id } // fixed: removed invalid systemUser column check
  });

  if (!fromUserAccount) {
    return res.status(404).json({ message: 'System user account not found' });
  }

  const session = await sequelize.transaction(); // fixed: removed session.start()

  try {
    const transaction = (await transactionModel.create({
      fromAccountId: fromUserAccount.id,
      toAccountId: toUserAccount.id,
      amount,
      idempotencyKey,
      status: 'PENDING'
    }, { transaction: session })); // fixed: was `new transactionModel()`

    await ledgerModel.create({
      amount: amount,
      accountId: fromUserAccount.id,
      transactionId: transaction.id,
      type: 'debit'
    }, { transaction: session });

    await ledgerModel.create({
      amount: amount,
      accountId: toUserAccount.id,
      transactionId: transaction.id,
      type: 'credit'
    }, { transaction: session });

    await transactionModel.update(
  { status: 'COMPLETED' },
  { where: { id: transaction.id }, transaction: session }
);

await session.commit();

transaction.status = 'COMPLETED'; 

return res.status(201).json({
  message: 'Initial funds transaction completed successfully',
  transaction
});


  } catch (error) {
    await session.rollback();
    console.error('Initial funds transaction failed:', error);
    return res.status(500).json({ message: 'Transaction failed', error: error.message });
  }

}

module.exports = { createTransaction, createInitialFundsTransaction };