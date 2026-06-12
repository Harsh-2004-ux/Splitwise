import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// @desc    Get all users (for demo - shows email and name only)
// @route   GET /api/users
// @access  Public
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}).select('_id name email');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
