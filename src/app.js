const express = require ('express');
const cookieParser = require('cookie-parser');


const app = express();
app.use(express.json());
app.use(cookieParser());

/**
 * - Routes required
 */
const authRoutes = require('../src/routes/auth.routes');
const accountRoutes = require('../src/routes/accounts.routes');
const transactionRoutes = require('../src/routes/transaction.routes');

/**
 * - use routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);


module.exports = app;