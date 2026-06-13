import express from 'express';
import Group from '../models/Group.js';
import ImportRun from '../models/ImportRun.js';
import { protect } from '../middleware/auth.js';
import { importExpenseCsv } from '../utils/csvImportEngine.js';

const router = express.Router();

router.post('/groups/:groupId/imports', protect, async (req, res) => {
  try {
    const { csvText, fileName } = req.body;
    const { groupId } = req.params;

    if (!csvText || typeof csvText !== 'string') {
      return res.status(400).json({ message: 'csvText is required' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isMember = group.members.some((member) => member.user.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized: not a member of this group' });
    }

    const result = await importExpenseCsv({ groupId, importedBy: req.user._id, csvText });

    const importRun = await ImportRun.create({
      groupId,
      importedBy: req.user._id,
      fileName: fileName || 'expenses_export.csv',
      summary: result.summary,
      policies: result.policies,
      rows: result.rows,
    });

    res.status(201).json(importRun);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/groups/:groupId/imports/latest', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isMember = group.members.some((member) => member.user.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized: not a member of this group' });
    }

    const importRun = await ImportRun.findOne({ groupId: req.params.groupId })
      .populate('importedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(importRun || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
