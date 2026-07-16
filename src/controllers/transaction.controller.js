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

   /** 5. Create transaction (PENDING) */

   const t = await sequelize.transaction(); // changed: mongoose session -> sequelize transaction

   try { // added: try/catch required to rollback on failure

   const transaction = await transactionModel.create({
    fromAccountId: fromAccount, // fixed: was fromAccount, must match model field name
    toAccountId: toAccount, // fixed: was toAccount, must match model field name
    amount,
    idempotencyKey,
    status: 'PENDING'
  }, { transaction: t }); // changed: session -> transaction: t

  const debitLedgerEntry = await ledgerModel.create({
    accountId: fromAccount, // fixed: was account, must match model field name
    amount: amount,
    transactionId: transaction.id, // fixed: was transaction, must match model field name
    type: 'debit'
  }, { transaction: t });


  const creditLedgerEntry = await ledgerModel.create({
    accountId: toAccount, // fixed: was account, must match model field name
    amount: amount,
    transactionId: transaction.id, // fixed: was transaction, must match model field name
    type: 'credit'
  }, { transaction: t });

  transaction.status = 'COMPLETED';
  await transaction.save({ transaction: t }); // changed: session -> transaction: t

  await t.commit(); // changed: session.commitTransaction() -> t.commit()

  /** 10. Send email notification */

  await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount);

  res.status(201).json({
    message: 'Transaction completed successfully',
    transaction
  });

  } catch (error) { // added: required, otherwise a failed step leaves DB inconsistent
    await t.rollback();
    console.error('Transaction failed:', error);
    res.status(500).json({ message: 'Transaction failed', error: error.message });
  }

}

async function createInitialFundsTransaction(req, res) {
  const { toAccount, amount, idempotencyKey } = req.body;

  if (!toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({ 
      message: 'Missing required fields'
     });
  }

  const toUserAccount = await accountModel.findOne({
    where: { id: toAccount } // changed: _id -> where: { id }
  });

  if (!toUserAccount) {
    return res.status(404).json({ message: 'Invalid toAccount' });
  }

  const fromUserAccount = await accountModel.findOne({ 
    where: { 
      systemUser: true ,
      userId: req.user.id
    }
  }); // changed: findOne({ systemUser: true })

  if (!fromUserAccount) {
    return res.status(404).json({ message: 'System user account not found' });
  }


  const session = await sequelize.transaction(); // changed: mongoose session -> sequelize transaction
  session.start(); // changed: session.startSession() -> session.start()

  const transaction = await transactionModel.create({
    fromAccountId: fromUserAccount.id, 
    toAccountId: toUserAccount.id, 
    amount,
    idempotencyKey,
    status: 'PENDING'
  }, { transaction: session }); 

  const debitLedgerEntry = await ledgerModel.create({
    amount: amount,
     account: fromUserAccount.id,
      transaction: transaction.id,
       type: 'debit'}, 
       { transaction: session });

  const creditLedgerEntry = await ledgerModel.create({
    amount: amount,
     account: toUserAccount.id, 
     transaction: transaction.id, 
     type: 'credit'}, 
     { transaction: session }
    );

    transaction.status = 'COMPLETED';
    await transaction.save({ transaction: session });

    await session.commit(); // changed: session.commitTransaction() -> session.commit()
    session.end(); // changed: session.endSession() -> session.end()

    return res.status(201).json({
      message: 'Initial funds transaction completed successfully',
      transaction: transaction
    });

}

module.exports = { createTransaction, createInitialFundsTransaction };