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
  },
  originalAmount: {
    type: Number,
    default: null,
  },
  originalCurrency: {
    type: String,
    default: 'INR',
    uppercase: true,
    trim: true,
  },
  exchangeRate: {
    type: Number,
    default: 1,
  },
  importSource: {
    rowNumber: Number,
    rawDescription: String,
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
