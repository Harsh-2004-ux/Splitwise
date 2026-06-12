import express from 'express';
import Expense from '../models/Expense.js';
import Group from '../models/Group.js';
import Settlement from '../models/Settlement.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { calculateSplits } from '../utils/splitEngine.js';
import { simplifyDebts } from '../utils/debtSimplifier.js';

const router = express.Router();

// ==========================================
// EXPENSES ROUTES
// ==========================================

// @desc    Get all expenses for a group
// @route   GET /api/groups/:groupId/expenses
// @access  Private
router.get('/groups/:groupId/expenses', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check membership
    const isMember = group.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized: not a member of this group' });
    }

    const expenses = await Expense.find({ groupId: req.params.groupId })
      .populate('paidBy', 'name email')
      .populate('splits.user', 'name email')
      .sort({ createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a new expense
// @route   POST /api/groups/:groupId/expenses
// @access  Private
router.post('/groups/:groupId/expenses', protect, async (req, res) => {
  try {
    const { title, amount, splitType, splitsInput, paidBy } = req.body;
    const { groupId } = req.params;

    if (!title || !amount || !splitType || !splitsInput) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check membership
    const isMember = group.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized: not a member of this group' });
    }

    // Calculate splits using split engine
    let finalSplits;
    try {
      finalSplits = calculateSplits(Number(amount), splitType, splitsInput);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const expense = await Expense.create({
      groupId,
      paidBy: paidBy || req.user._id,
      title,
      amount: Number(amount),
      splitType,
      splits: finalSplits,
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate('paidBy', 'name email')
      .populate('splits.user', 'name email');

    // Emit Socket.io event in server if io is attached
    if (req.io) {
      req.io.to(groupId).emit('expense:created', populatedExpense);
    }

    res.status(201).json(populatedExpense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private
router.put('/expenses/:id', protect, async (req, res) => {
  try {
    const { title, amount, splitType, splitsInput, paidBy } = req.body;

    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const group = await Group.findById(expense.groupId);
    // Check membership
    const isMember = group.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized: not a member of this group' });
    }

    if (title) expense.title = title;
    if (paidBy) expense.paidBy = paidBy;

    if (amount || splitType || splitsInput) {
      const activeAmount = amount !== undefined ? Number(amount) : expense.amount;
      const activeSplitType = splitType || expense.splitType;
      
      // If splits input is missing, use existing users in split with Equal type
      let activeSplitsInput = splitsInput;
      if (!activeSplitsInput) {
        activeSplitsInput = expense.splits.map((s) => ({ user: s.user.toString(), value: s.shareUnits }));
      }

      try {
        expense.splits = calculateSplits(activeAmount, activeSplitType, activeSplitsInput);
        expense.amount = activeAmount;
        expense.splitType = activeSplitType;
      } catch (err) {
        return res.status(400).json({ message: err.message });
      }
    }

    await expense.save();

    const populatedExpense = await Expense.findById(expense._id)
      .populate('paidBy', 'name email')
      .populate('splits.user', 'name email');

    if (req.io) {
      req.io.to(expense.groupId.toString()).emit('balance:updated', { groupId: expense.groupId });
    }

    res.json(populatedExpense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
router.delete('/expenses/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const group = await Group.findById(expense.groupId);
    // Check membership
    const isMember = group.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const groupId = expense.groupId.toString();
    await Expense.findByIdAndDelete(req.params.id);

    if (req.io) {
      req.io.to(groupId).emit('balance:updated', { groupId });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// BALANCES & SETTLEMENTS ROUTES
// ==========================================

// @desc    Get simplified balances for a group
// @route   GET /api/groups/:groupId/balances
// @access  Private
router.get('/groups/:groupId/balances', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId).populate('members.user', 'name email');
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check membership
    const isMember = group.members.some((m) => m.user._id.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const expenses = await Expense.find({ groupId: req.params.groupId });
    const settlements = await Settlement.find({ groupId: req.params.groupId });

    const simplified = simplifyDebts(group.members, expenses, settlements);

    // Populate user details inside the simplified settlements response for client presentation
    const detailedSettlements = await Promise.all(
      simplified.suggestedSettlements.map(async (item) => {
        const fromUser = await User.findById(item.from).select('name email');
        const toUser = await User.findById(item.to).select('name email');
        return {
          from: item.from,
          fromUser,
          to: item.to,
          toUser,
          amount: item.amount,
        };
      })
    );

    // Form friendly list of net balances
    const detailedBalances = await Promise.all(
      Object.keys(simplified.netBalances).map(async (userId) => {
        const user = await User.findById(userId).select('name email');
        return {
          user,
          balance: simplified.netBalances[userId],
        };
      })
    );

    res.json({
      balances: detailedBalances,
      suggestedSettlements: detailedSettlements,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get overall balance summaries for current user
// @route   GET /api/users/me/balances
// @access  Private
router.get('/users/me/balances', protect, async (req, res) => {
  try {
    // Find all groups where the user is a member
    const groups = await Group.find({ 'members.user': req.user._id }).populate('members.user', 'name email');

    let totalOwed = 0;
    let totalOwedToMe = 0;
    const groupSummaries = [];

    for (const group of groups) {
      const expenses = await Expense.find({ groupId: group._id });
      const settlements = await Settlement.find({ groupId: group._id });

      const { netBalances } = simplifyDebts(group.members, expenses, settlements);
      const userBalance = netBalances[req.user._id.toString()] || 0;

      if (userBalance > 0) {
        totalOwedToMe += userBalance;
      } else if (userBalance < 0) {
        totalOwed += Math.abs(userBalance);
      }

      groupSummaries.push({
        groupId: group._id,
        groupName: group.name,
        balance: userBalance,
      });
    }

    res.json({
      netBalance: Math.round((totalOwedToMe - totalOwed) * 100) / 100,
      totalOwed: Math.round(totalOwed * 100) / 100,
      totalOwedToMe: Math.round(totalOwedToMe * 100) / 100,
      groupSummaries,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get settlements list for a group
// @route   GET /api/groups/:groupId/settlements
// @access  Private
router.get('/groups/:groupId/settlements', protect, async (req, res) => {
  try {
    const settlements = await Settlement.find({ groupId: req.params.groupId })
      .populate('payerId', 'name email')
      .populate('payeeId', 'name email')
      .sort({ settledAt: -1 });
    res.json(settlements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Record a settlement payment
// @route   POST /api/groups/:groupId/settlements
// @access  Private
router.post('/groups/:groupId/settlements', protect, async (req, res) => {
  try {
    const { payerId, payeeId, amount, note } = req.body;
    const { groupId } = req.params;

    if (!payerId || !payeeId || !amount) {
      return res.status(400).json({ message: 'Payer, payee and amount are required' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const settlement = await Settlement.create({
      groupId,
      payerId,
      payeeId,
      amount: Number(amount),
      note: note || '',
    });

    const populated = await Settlement.findById(settlement._id)
      .populate('payerId', 'name email')
      .populate('payeeId', 'name email');

    if (req.io) {
      req.io.to(groupId).emit('balance:updated', { groupId });
    }

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
