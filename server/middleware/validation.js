/**
 * Validation middleware for user and authentication inputs
 */

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate user registration payload
 */
export const validateRegister = (req, res, next) => {
  const { username, email, photoURL, displayName } = req.body;
  const errors = [];

  if (!username || typeof username !== 'string') {
    errors.push('Username is required and must be a string.');
  } else {
    const trimmed = username.trim();
    if (trimmed.length < 3 || trimmed.length > 20) {
      errors.push('Username must be between 3 and 20 characters.');
    }
    if (!USERNAME_REGEX.test(trimmed)) {
      errors.push('Username can only contain letters, numbers, and underscores.');
    }
  }

  if (email && (typeof email !== 'string' || !EMAIL_REGEX.test(email))) {
    errors.push('Invalid email address format.');
  }

  if (photoURL && typeof photoURL !== 'string') {
    errors.push('Photo URL must be a valid string.');
  }

  if (displayName && typeof displayName !== 'string') {
    errors.push('Display name must be a valid string.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: errors[0],
      details: errors,
    });
  }

  // Normalize username
  req.body.username = username.trim().toLowerCase();
  next();
};

/**
 * Validate user profile update payload
 */
export const validateUpdateProfile = (req, res, next) => {
  const { username, photoURL } = req.body;
  const errors = [];

  if (username !== undefined) {
    if (typeof username !== 'string') {
      errors.push('Username must be a string.');
    } else {
      const trimmed = username.trim();
      if (trimmed.length < 3 || trimmed.length > 20) {
        errors.push('Username must be between 3 and 20 characters.');
      }
      if (!USERNAME_REGEX.test(trimmed)) {
        errors.push('Username can only contain letters, numbers, and underscores.');
      }
      req.body.username = trimmed.toLowerCase();
    }
  }

  if (photoURL !== undefined && typeof photoURL !== 'string') {
    errors.push('Photo URL must be a string.');
  }

  if (username === undefined && photoURL === undefined) {
    errors.push('At least one field (username or photoURL) must be provided to update.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: errors[0],
      details: errors,
    });
  }

  next();
};

/**
 * Validate request to issue or exchange JWT token
 */
export const validateTokenRequest = (req, res, next) => {
  const { uid } = req.body;

  if (!uid || typeof uid !== 'string' || !uid.trim()) {
    return res.status(400).json({
      error: 'User ID (uid) is required to issue a token.',
    });
  }

  req.body.uid = uid.trim();
  next();
};
