const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token — please log in' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Role-Based Access Control (RBAC) Middleware
 * Securely partitions administrative, dispatch officer, and user operational workflows
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const userRole = req.user.role || 'user';
    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Forbidden: Insufficient privileges for this operational workflow' 
      });
    }
    next();
  };
}

authMiddleware.requireRole = requireRole;
module.exports = authMiddleware;
module.exports.authMiddleware = authMiddleware;
module.exports.requireRole = requireRole;
