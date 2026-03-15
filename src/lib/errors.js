/**
 * Respostas de erro padronizadas em JSON { message: string }
 */
function badRequest(res, message) {
  return res.status(400).json({ message: message || 'Requisição inválida' });
}

function unauthorized(res, message) {
  return res.status(401).json({ message: message || 'Não autenticado' });
}

function notFound(res, message) {
  return res.status(404).json({ message: message || 'Não encontrado' });
}

function conflict(res, message) {
  return res.status(409).json({ message: message || 'Conflito' });
}

function serverError(res, message) {
  return res.status(500).json({ message: message || 'Erro interno do servidor' });
}

module.exports = {
  badRequest,
  unauthorized,
  notFound,
  conflict,
  serverError,
};
