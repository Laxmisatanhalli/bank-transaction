const express = require ('express');
const {connectTodb} = require('./config/db');



const app = express();
connectTodb();


module.exports = app;