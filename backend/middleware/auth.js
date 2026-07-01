// middleware/auth.js — JWT Authentication & Role Authorization middleware
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect — Verifies JWT token and attaches user to req.user
 * Usage: router.get('/route', protect, handler)
 */
const protect = async (req, res, next) => {
  let token;

  // Extract token from Authorization header (Bearer <token>)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request (exclude password)
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    if (!req.user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: err.name === 'TokenExpiredError' ? 'Token expired. Please log in again.' : 'Invalid token.',
    });
  }
};

/**
 * authorize — Restricts access by role(s)
 * Usage: router.get('/route', protect, authorize('teacher'), handler)
 *        router.get('/route', protect, authorize('teacher', 'student'), handler)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized for this resource.`,
      });
    }
    next();
  };
};

/**
 * studentSelf — Ensures students can only access their own data.
 * Teachers can access any student's data.
 * req.params.studentId must match the logged-in student's profile ID.
 */
const studentSelf = async (req, res, next) => {
  if (req.user.role === 'teacher') return next(); // Teachers pass through

  // For students — verify they're accessing their own data
  const requestedId = req.params.studentId || req.params.id;
  const studentProfileId = req.user.studentProfile?.toString();

  if (!studentProfileId || studentProfileId !== requestedId) {
    return res.status(403).json({
      success: false,
      message: 'Students can only access their own data.',
    });
  }

  next();
};

module.exports = { protect, authorize, studentSelf };
