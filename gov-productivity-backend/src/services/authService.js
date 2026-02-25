const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/passwordHash');
const jwtConfig = require('../config/jwt');
const auditService = require('./auditService');

const toSafeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department,
  designation: user.designation,
});

const signToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    },
    jwtConfig.secret,
    {
      expiresIn: jwtConfig.expiresIn,
      issuer: jwtConfig.issuer,
    },
  );

const register = async (payload, actor) => {
  const existing = await User.findByEmail(payload.email);
  if (existing) {
    const error = new Error('Email already registered');
    error.statusCode = 409;
    throw error;
  }

  const password_hash = await hashPassword(payload.password);
  const created = await User.createUser({ ...payload, password_hash });

  await auditService.logAction(actor?.id || null, 'USER_REGISTERED', 'users', created.id, {
    email: created.email,
    role: created.role,
  });

  return created;
};

const login = async (email, password, context = {}) => {
  const user = await User.findByEmail(email);
  if (!user) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  const match = await comparePassword(password, user.password_hash);
  if (!match) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  const token = signToken(user);

  await auditService.logAction(user.id, 'USER_LOGIN', 'users', user.id, {
    ip: context.ip,
    agent: context.userAgent,
  });

  return { token, user: toSafeUser(user) };
};

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return toSafeUser(user);
};

module.exports = {
  register,
  login,
  getCurrentUser,
};
