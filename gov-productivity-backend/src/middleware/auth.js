const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    const cookieToken = req.cookies?.token;
    const token =
      (header && header.startsWith('Bearer ') && header.split(' ')[1]) || cookieToken;
    if (!token) {
      return res.status(401).json({ message: 'Authorization token missing' });
    }

    const decoded = jwt.verify(token, jwtConfig.secret, {
      algorithms: [jwtConfig.algorithm || 'HS256'],
      issuer: jwtConfig.issuer,
    });

    const userId = decoded.sub || decoded.id || decoded.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    const user = await User.findById(userId);
    if (!user || user.is_active === false) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      designation: user.designation,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = auth;