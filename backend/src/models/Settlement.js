import mongoose from 'mongoose';

const settlementSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  payerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  payeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: [true, 'Settlement amount is required'],
    min: 0.01,
  },
  note: {
    type: String,
    trim: true,
  },
  settledAt: {
    type: Date,
    default: Date.now,
  },
});

const Settlement = mongoose.model('Settlement', settlementSchema);
export default Settlement;
