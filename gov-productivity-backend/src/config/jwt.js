module.exports = {
  secret: process.env.JWT_SECRET || 'change-me',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  algorithm: 'HS256',
  issuer: 'gov-productivity-system',
};