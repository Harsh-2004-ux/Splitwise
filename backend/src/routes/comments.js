import express from 'express';
import Comment from '../models/Comment.js';
import Expense from '../models/Expense.js';
import Group from '../models/Group.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get comments for a specific expense
// @route   GET /api/expenses/:expenseId/comments
// @access  Private
router.get('/expenses/:expenseId/comments', protect, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.expenseId);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check if user is member of this group
    const group = await Group.findById(expense.groupId);
    const isMember = group.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized: not a group member' });
    }

    const comments = await Comment.find({ expenseId: req.params.expenseId })
      .populate('userId', 'name email')
      .sort({ createdAt: 1 }); // Oldest first for chat timeline

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Post a comment on an expense
// @route   POST /api/expenses/:expenseId/comments
// @access  Private
router.post('/expenses/:expenseId/comments', protect, async (req, res) => {
  try {
    const { message } = req.body;
    const { expenseId } = req.params;

    if (!message) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check membership
    const group = await Group.findById(expense.groupId);
    const isMember = group.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const comment = await Comment.create({
      expenseId,
      userId: req.user._id,
      message,
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('userId', 'name email');

    // Socket.io emission
    if (req.io) {
      // Emit to the expense-specific socket room
      req.io.to(expenseId).emit('comment:new', populatedComment);
    }

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
