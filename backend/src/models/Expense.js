import mongoose from 'mongoose';

const expenseSplitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  owedAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  shareUnits: {
    type: Number,
    default: null,
  },
});

const expenseSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Expense title is required'],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, 'Expense amount is required'],
    min: 0.01,
  },
  splitType: {
    type: String,
    enum: ['EQUAL', 'UNEQUAL', 'PERCENTAGE', 'SHARE'],
    required: true,
  },
  splits: [expenseSplitSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
