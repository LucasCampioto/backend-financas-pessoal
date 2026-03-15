const mongoose = require('mongoose');

/**
 * Conecta ao MongoDB usando MONGODB_URI.
 * @param {string} uri - URI de conexão (ex.: process.env.MONGODB_URI)
 * @returns {Promise<void>}
 */
async function connectDb(uri) {
  await mongoose.connect(uri);
}

module.exports = { connectDb };
