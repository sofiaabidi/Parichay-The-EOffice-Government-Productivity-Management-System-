const authService = require('../services/authService');

const getCookieOptions = () => ({
  httpOnly: true,
  sameSite: process.env.COOKIE_SAMESITE || 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 24 * 60 * 60 * 1000, // 1 day
});

const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body, req.user);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body.email, req.body.password, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res
      .cookie('token', result.token, getCookieOptions())
      .json({ user: result.user, token: result.token });
  } catch (error) {
    next(error);
  }
};

const loginFieldManager = async (req, res, next) => {
  try {
    const result = await authService.login(req.body.email, req.body.password, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Check if user has the correct role
    if (result.user.role !== 'FIELD_MANAGER') {
      return res.status(403).json({
        message: 'Invalid role for Field Manager login',
      });
    }

    res
      .cookie('token', result.token, getCookieOptions())
      .json({ user: result.user, token: result.token });
  } catch (error) {
    next(error);
  }
};

const loginFieldEmployee = async (req, res, next) => {
  try {
    const result = await authService.login(req.body.email, req.body.password, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Check if user has the correct role
    if (result.user.role !== 'FIELD_EMPLOYEE') {
      return res.status(403).json({
        message: 'Invalid role for Field Employee login',
      });
    }

    res
      .cookie('token', result.token, getCookieOptions())
      .json({ user: result.user, token: result.token });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

const logout = async (_req, res) => {
  res.clearCookie('token', getCookieOptions());
  res.status(204).send();
};

module.exports = {
  register,
  login,
  me,
  logout,
  loginFieldManager,
  loginFieldEmployee,
};
