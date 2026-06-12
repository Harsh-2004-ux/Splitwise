import express from 'express';
import Group from '../models/Group.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all groups for logged-in user
// @route   GET /api/groups
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const groups = await Group.find({ 'members.user': req.user._id })
      .populate('members.user', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get group details by ID
// @route   GET /api/groups/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.id || req.params.id)
      .populate('members.user', 'name email')
      .populate('createdBy', 'name email');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a member of this group
    const isMember = group.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied: not a member of this group' });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    const newGroup = await Group.create({
      name,
      description,
      createdBy: req.user._id,
      members: [
        {
          user: req.user._id,
          role: 'admin',
        },
      ],
    });

    const populatedGroup = await Group.findById(newGroup._id).populate(
      'members.user',
      'name email'
    );

    res.status(201).json(populatedGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Add member to group by email
// @route   POST /api/groups/:id/members
// @access  Private
router.post('/:id/members', protect, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if current user is member
    const currentMember = group.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!currentMember) {
      return res.status(403).json({ message: 'Access denied: not a member of this group' });
    }

    // Find the user to add
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res.status(404).json({ message: 'User with this email not found' });
    }

    // Check if user is already a member
    const alreadyMember = group.members.some(
      (m) => m.user.toString() === userToAdd._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member of this group' });
    }

    group.members.push({
      user: userToAdd._id,
      role: 'member',
    });

    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate('members.user', 'name email')
      .populate('createdBy', 'name email');

    res.status(200).json(updatedGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Remove member from group
// @route   DELETE /api/groups/:id/members/:uid
// @access  Private
router.delete('/:id/members/:uid', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if current user is admin, or the member themselves (leaving)
    const currentUserMember = group.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!currentUserMember) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    const targetUserId = req.params.uid;
    const isSelfLeaving = req.user._id.toString() === targetUserId;
    const isAdmin = currentUserMember.role === 'admin';

    if (!isAdmin && !isSelfLeaving) {
      return res.status(403).json({ message: 'Only admins can remove other members' });
    }

    // Prevent removing the creator if they are the only admin
    if (group.createdBy.toString() === targetUserId) {
      const adminCount = group.members.filter((m) => m.role === 'admin').length;
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot remove the creator/only admin of the group' });
      }
    }

    group.members = group.members.filter(
      (m) => m.user.toString() !== targetUserId
    );

    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate('members.user', 'name email')
      .populate('createdBy', 'name email');

    res.status(200).json(updatedGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
