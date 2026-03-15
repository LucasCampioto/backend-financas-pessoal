const express = require('express');
const { body, validationResult } = require('express-validator');
const { createUser, findUserByEmail } = require('../adapters/mongodb/user');
const { hashPassword, comparePassword, createToken } = require('../services/auth');
const { requireAuth } = require('../middleware/auth');
const { badRequest, unauthorized, conflict } = require('../lib/errors');

const router = express.Router();

const COOKIE_NAME = 'token';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

function getCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: COOKIE_MAX_AGE_MS,
  };
}

const signupValidation = [
  body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('email').trim().isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Senha é obrigatória'),
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Senha é obrigatória'),
];

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msg = errors.array().map((e) => e.msg).join('; ');
    return badRequest(res, msg);
  }
  next();
}

async function postSignup(req, res) {
  const { name, email, password } = req.body;
  const existing = await findUserByEmail(email);
  if (existing) {
    return conflict(res, 'Email já cadastrado');
  }
  const passwordHash = await hashPassword(password);
  const user = await createUser(name, email.trim(), passwordHash);
  const token = createToken(user._id, user.email, process.env.JWT_SECRET);
  res.cookie(COOKIE_NAME, token, getCookieOptions());
  return res.status(201).json({ user: { email: user.email, name: user.name } });
}

async function postLogin(req, res) {
  const { email, password } = req.body;
  const user = await findUserByEmail(email.trim());
  if (!user) {
    return unauthorized(res, 'Credenciais inválidas');
  }
  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) {
    return unauthorized(res, 'Credenciais inválidas');
  }
  const token = createToken(user._id, user.email, process.env.JWT_SECRET);
  res.cookie(COOKIE_NAME, token, getCookieOptions());
  return res.status(200).json({ user: { email: user.email, name: user.name } });
}

function postLogout(_req, res) {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  });
  return res.status(204).send();
}

function getMe(req, res) {
  return res.status(200).json({ email: req.user.email, name: req.user.name });
}

router.post('/signup', signupValidation, handleValidation, postSignup);
router.post('/login', loginValidation, handleValidation, postLogin);
router.post('/logout', requireAuth, postLogout);
router.get('/me', requireAuth, getMe);

module.exports = router;
