import express from 'express';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRegister, validateUpdateProfile } from '../middleware/validation.js';
import { generateToken } from '../utils/jwt.js';

const router = express.Router();

// GET /api/users/me
// Protected by JWT authenticateToken middleware.
// Attaches decoded user payload to req.user.
router.get('/me', authenticateToken, async (req, res) => {
  const uid = req.user?.uid;

  if (!uid) {
    return res.status(401).json({ error: 'Unauthorized: User ID not found in token' });
  }

  try {
    const user = await User.findOne({ uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/register
// Protected by JWT authenticateToken middleware and validated by validateRegister
router.post('/register', authenticateToken, validateRegister, async (req, res) => {
  const uid = req.user?.uid;
  const { username, email, photoURL, displayName } = req.body;

  if (!uid) {
    return res.status(401).json({ error: 'Unauthorized: User ID not found in token' });
  }

  try {
    const lowerUsername = username.toLowerCase();

    // Check if username exists
    const existingUser = await User.findOne({ username: lowerUsername });
    if (existingUser) {
      return res.status(409).json({ error: 'Username is already taken.' });
    }

    // Check if the UID already registered a username
    const existingUid = await User.findOne({ uid });
    if (existingUid) {
      return res.status(409).json({ error: 'User has already claimed a username.' });
    }

    // Create new user profile
    const newUser = new User({
      uid,
      username: lowerUsername,
      email: email || req.user?.email || null,
      photoURL: photoURL || req.user?.photoURL || null,
      displayName: displayName || req.user?.displayName || null,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      rating: 1200,
    });

    await newUser.save();

    // Generate refreshed JWT including the newly claimed username
    const token = generateToken({
      uid: newUser.uid,
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      displayName: newUser.displayName,
      photoURL: newUser.photoURL,
    });

    const userObj = newUser.toObject();
    res.status(201).json({
      ...userObj,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register username' });
  }
});

// PUT /api/users/update
// Protected by JWT authenticateToken middleware and validated by validateUpdateProfile
router.put('/update', authenticateToken, validateUpdateProfile, async (req, res) => {
  const uid = req.user?.uid;
  const { username, photoURL } = req.body;

  if (!uid) {
    return res.status(401).json({ error: 'Unauthorized: User ID not found in token' });
  }

  try {
    const updateFields = {};

    if (username) {
      const lowerUsername = username.toLowerCase();
      // Check if the username is already taken by a DIFFERENT user
      const existingUser = await User.findOne({ username: lowerUsername });
      if (existingUser && existingUser.uid !== uid) {
        return res.status(409).json({ error: 'Username is already taken.' });
      }
      updateFields.username = lowerUsername;
    }

    if (photoURL !== undefined) {
      updateFields.photoURL = photoURL;
    }

    // Find and update the user
    const updatedUser = await User.findOneAndUpdate(
      { uid },
      updateFields,
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate updated token
    const token = generateToken({
      uid: updatedUser.uid,
      id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      displayName: updatedUser.displayName,
      photoURL: updatedUser.photoURL,
    });

    const userObj = updatedUser.toObject();
    res.json({
      ...userObj,
      token,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /api/users/:username (Public profile lookup)
router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Return sanitized public info
    res.json({
      username: user.username,
      displayName: user.displayName,
      photoURL: user.photoURL,
      rating: user.rating,
      wins: user.wins,
      losses: user.losses,
      matchesPlayed: user.matchesPlayed,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch public profile' });
  }
});

export default router;
