const roleCheck = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  // Normalize role comparison (case-insensitive)
  const userRole = req.user.role?.toUpperCase();
  const allowedRoles = roles.map(r => r.toUpperCase());

  if (!allowedRoles.includes(userRole)) {
    console.log(`Role check failed: User role "${req.user.role}" (normalized: "${userRole}") not in allowed roles:`, roles);
    console.log(`User details:`, { id: req.user.id, email: req.user.email, role: req.user.role });
    return res.status(403).json({
      message: 'Insufficient permissions',
      userRole: req.user.role,
      requiredRoles: roles,
      debug: {
        userRoleNormalized: userRole,
        allowedRolesNormalized: allowedRoles,
        userId: req.user.id,
        userEmail: req.user.email
      }
    });
  }
  return next();
};

module.exports = roleCheck;
