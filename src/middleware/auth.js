const jwt = require('jsonwebtoken');
const { findUserById } = require('../adapters/mongodb/user');
const { unauthorized } = require('../lib/errors');

const COOKIE_NAME = 'token';

/**
 * Middleware que verifica o JWT no cookie (req.cookies.token) ou no header
 * Authorization: Bearer <token>, e anexa o usuário em req.user. Em falha, responde 401.
 */
async function requireAuth(req, res, next) {
  let token = req.cookies && req.cookies[COOKIE_NAME];
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }
  if (!token) {
    return unauthorized(res, 'Token não informado');
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ message: 'Configuração do servidor inválida' });
  }
  let payload;
  try {
    payload = jwt.verify(token, secret);
  } catch {
    return unauthorized(res, 'Token inválido ou expirado');
  }
  const user = await findUserById(payload.userId);
  if (!user) {
    return unauthorized(res, 'Usuário não encontrado');
  }
  req.user = { _id: user._id, id: String(user._id), email: user.email, name: user.name };
  next();
}

module.exports = { requireAuth };
