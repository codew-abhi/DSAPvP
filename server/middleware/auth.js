import { verifyToken } from '../utils/jwt.js';

/**
 * Authentication middleware that verifies JWT token from Authorization header.
 * Supports Bearer token format: "Bearer <token>"
 * Includes backward compatibility for transitional legacy "x-user-uid" header.
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  let token = null;

  if (authHeader && typeof authHeader === 'string') {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      token = parts[1];
    } else {
      token = authHeader; // fallback if raw token passed in header
    }
  } else if (req.headers['x-access-token']) {
    token = req.headers['x-access-token'];
  }

  if (token) {
    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      return next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token has expired. Please authenticate again.',
          code: 'TOKEN_EXPIRED',
        });
      }
      return res.status(401).json({
        error: 'Invalid authentication token.',
        code: 'INVALID_TOKEN',
      });
    }
  }

  // Graceful fallback for legacy requests with x-user-uid header during migration
  const legacyUid = req.headers['x-user-uid'];
  if (legacyUid && typeof legacyUid === 'string') {
    req.user = { uid: legacyUid.trim(), isLegacy: true };
    return next();
  }

  return res.status(401).json({
    error: 'Unauthorized: Access denied. Bearer token is required.',
    code: 'AUTH_REQUIRED',
  });
};

/**
 * Strict authentication middleware that requires a valid JWT token only (no legacy fallback)
 */
export const requireStrictJwt = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  let token = null;

  if (authHeader && typeof authHeader === 'string') {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized: Valid Bearer JWT token required.',
      code: 'TOKEN_REQUIRED',
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token has expired. Please authenticate again.',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      error: 'Invalid authentication token.',
      code: 'INVALID_TOKEN',
    });
  }
};

/**
 * Authorization middleware to ensure a user can only modify their own resource.
 * @param {string} paramName - Route parameter holding the UID to match against (default: 'uid')
 */
export const authorizeOwner = (paramName = 'uid') => {
  return (req, res, next) => {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ error: 'Unauthorized: Missing user credentials' });
    }

    const targetUid = req.params[paramName] || req.body[paramName];
    if (targetUid && targetUid !== req.user.uid) {
      return res.status(403).json({
        error: 'Forbidden: You do not have permission to access or modify this resource.',
        code: 'FORBIDDEN',
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware - attaches decoded user if token exists,
 * but allows unauthenticated requests to proceed.
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || typeof authHeader !== 'string') {
    return next();
  }

  const parts = authHeader.split(' ');
  const token = parts.length === 2 && parts[0].toLowerCase() === 'bearer' ? parts[1] : null;

  if (token) {
    try {
      req.user = verifyToken(token);
    } catch {
      // Ignore token errors for optional auth
    }
  }

  next();
};
