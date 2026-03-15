require('dotenv').config();
const app = require('../src/app');
const { connectDb } = require('../src/config/db');

const uri = process.env.MONGODB_URI;
if (uri) {
  connectDb(uri);
}

module.exports = app;
