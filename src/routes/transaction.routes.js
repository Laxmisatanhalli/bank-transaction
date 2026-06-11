const { Router } = require('express');
const authMiddleware = require('../middlewares/auth.middleware');


const transactionRoutes = Router();


/**
 * - POST /api/transactions
 * - CREATE a new transaction
 */

transactionRoutes.post('/',authMiddleware.authMiddleware, createTransaction)

module.exports = transactionRoutes;