require('dotenv').config();
const app = require('./src/app')
const {connectTodb} = require('./src/config/db');
const { sequelize } = require('./src/config/db');
const db = require('./src/models'); // loads models + associations


connectTodb();

sequelize.sync({ alter: true }) // creates/updates tables to match models
  .then(() => console.log('Tables synced'))
  .catch(err => console.error('Sync error:', err));


app.listen(3000, () => {
    console.log('Server is running on port 3000');
})