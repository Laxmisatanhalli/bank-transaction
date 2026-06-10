
const express = require ('express');


const cookieParser = require('cookie-parser');
const authRoutes = require('../src/routes/auth.routes');
const accountRoutes = require('../src/routes/accounts.routes');

/**
 * - Routes required
 */
const app = express();
app.use(express.json());
app.use(cookieParser());

/**
 * - use routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);


module.exports = app;
//createing and config the server