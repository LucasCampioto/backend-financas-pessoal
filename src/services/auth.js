const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 10;

async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

function createToken(userId, email, secret, expiresIn = '7d') {
  return jwt.sign({ userId: String(userId), email }, secret, { expiresIn });
}

function verifyToken(token, secret) {
  return jwt.verify(token, secret);
}

module.exports = {
  hashPassword,
  comparePassword,
  createToken,
  verifyToken,
};
