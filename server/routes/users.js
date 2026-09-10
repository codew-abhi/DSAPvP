import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// GET /api/users/me
// In a real app, you would have middleware here to verify the Firebase token
// and attach the user ID to the request object. 
// For this MVP, we will pass the uid in a header.
router.get('/me', async (req, res) => {
  const uid = req.headers['x-user-uid'];
  
  if (!uid) {
    return res.status(401).json({ error: 'Unauthorized: Missing UID header' });
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
router.post('/register', async (req, res) => {
  const uid = req.headers['x-user-uid'];
  const { username, email, photoURL, displayName } = req.body;

  if (!uid) {
    return res.status(401).json({ error: 'Unauthorized: Missing UID header' });
  }
  
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
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
      email,
      photoURL,
      displayName,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      rating: 1200,
    });

    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register username' });
  }
});

// PUT /api/users/update
router.put('/update', async (req, res) => {
  const uid = req.headers['x-user-uid'];
  const { username, photoURL } = req.body;

  if (!uid) {
    return res.status(401).json({ error: 'Unauthorized: Missing UID header' });
  }

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const lowerUsername = username.toLowerCase();
    
    // Check if the username is already taken by a DIFFERENT user
    const existingUser = await User.findOne({ username: lowerUsername });
    if (existingUser && existingUser.uid !== uid) {
      return res.status(409).json({ error: 'Username is already taken.' });
    }

    // Find and update the user
    const updatedUser = await User.findOneAndUpdate(
      { uid },
      { username: lowerUsername, photoURL },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
