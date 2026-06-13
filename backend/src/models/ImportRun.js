import mongoose from 'mongoose';

const importAnomalySchema = new mongoose.Schema({
  rowNumber: Number,
  severity: {
    type: String,
    enum: ['info', 'warning', 'error'],
    default: 'warning',
  },
  code: String,
  field: String,
  message: String,
  action: String,
});

const importRowSchema = new mongoose.Schema({
  rowNumber: Number,
  description: String,
  status: {
    type: String,
    enum: ['accepted', 'adjusted', 'skipped', 'rejected', 'settlement'],
    required: true,
  },
  action: String,
  anomalies: [importAnomalySchema],
});

const importRunSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  importedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileName: {
    type: String,
    default: 'expenses_export.csv',
  },
  summary: {
    totalRows: Number,
    acceptedExpenses: Number,
    settlements: Number,
    skippedRows: Number,
    rejectedRows: Number,
    anomalyCount: Number,
  },
  policies: [String],
  rows: [importRowSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ImportRun = mongoose.model('ImportRun', importRunSchema);
export default ImportRun;
