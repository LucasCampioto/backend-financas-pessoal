const { validationResult } = require('express-validator');
const { badRequest } = require('../lib/errors');

/**
 * Middleware que executa o resultado do express-validator e responde 400 com
 * mensagem concatenada se houver erros.
 */
function handleValidationResult(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msg = errors.array().map((e) => e.msg).join('; ');
    return badRequest(res, msg);
  }
  next();
}

module.exports = { handleValidationResult };
