import express from 'express';
import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateTokenRequest } from '../middleware/validation.js';

const router = express.Router();

/**
 * POST /api/auth/token
 * Exchange user credentials/uid for a signed JWT token
 */
router.post('/token', validateTokenRequest, async (req, res) => {
  const { uid, email, displayName, photoURL } = req.body;

  try {
    // Check if the user already exists in the database
    const existingUser = await User.findOne({ uid });

    const payload = {
      uid,
      email: existingUser?.email || email || null,
      username: existingUser?.username || null,
      displayName: existingUser?.displayName || displayName || null,
      photoURL: existingUser?.photoURL || photoURL || null,
    };

    // Sign a new JWT valid for 7 days
    const token = generateToken(payload, '7d');

    return res.json({
      success: true,
      token,
      isRegistered: Boolean(existingUser),
      user: existingUser || { uid, email, displayName, photoURL },
    });
  } catch (error) {
    console.error('Error issuing JWT token:', error);
    return res.status(500).json({ error: 'Failed to generate authentication token' });
  }
});

/**
 * GET /api/auth/verify
 * Verify the current JWT token and return decoded token info
 */
router.get('/verify', authenticateToken, (req, res) => {
  return res.json({
    success: true,
    valid: true,
    user: req.user,
  });
});

/**
 * GET /api/auth/me
 * Protected endpoint to fetch the current authenticated user's DB profile
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    if (!user) {
      return res.status(404).json({
        error: 'User not registered yet',
        user: req.user,
        isRegistered: false,
      });
    }

    return res.json({
      success: true,
      user,
      tokenUser: req.user,
      isRegistered: true,
    });
  } catch (error) {
    console.error('Error fetching auth user profile:', error);
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

export default router;
