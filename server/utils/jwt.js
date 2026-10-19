import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const getSecretKey = () => {
  const secret = process.env.SECRET_KEY || process.env.JWT_SECRET;
  if (!secret) {
    console.warn('WARNING: SECRET_KEY / JWT_SECRET is not defined in environment variables! Using fallback secret.');
    return 'dsapvp-fallback-secret-key-2026';
  }
  return secret;
};

/**
 * Generate a signed JWT token
 * @param {Object} payload - Data to embed in the token (e.g., { uid, email, username })
 * @param {string|number} expiresIn - Expiration time (default: '7d')
 * @returns {string} Signed JWT
 */
export const generateToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, getSecretKey(), { expiresIn });
};

/**
 * Verify a JWT token
 * @param {string} token - The JWT string to verify
 * @returns {Object} Decoded payload
 * @throws {jwt.JsonWebTokenError|jwt.TokenExpiredError}
 */
export const verifyToken = (token) => {
  return jwt.verify(token, getSecretKey());
};

/**
 * Decode a token without verifying (useful for debugging/logging)
 * @param {string} token
 * @returns {Object|null}
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};
