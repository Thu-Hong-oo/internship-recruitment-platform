const express = require('express');
const router = express.Router();
const Industry = require('../../models/Industry');

// NOTE: parent admin router already applies protect + authorize('admin')

// List (including hidden) with query
router.get('/', async (req, res, next) => {
  try {
    const { q, parent } = req.query;
    const filter = {};
    if (parent) filter.parentCode = parent === 'root' ? null : parent;
    if (q) filter.$text = { $search: q };
    const items = await Industry.find(filter).sort({
      sortOrder: 1,
      'name.vi': 1,
    });
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
});

// Create
router.post('/', async (req, res, next) => {
  try {
    const created = await Industry.create(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

// Read by code
router.get('/:code', async (req, res, next) => {
  try {
    const item = await Industry.findOne({ code: req.params.code });
    if (!item)
      return res
        .status(404)
        .json({ success: false, error: 'Industry not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

// Update
router.put('/:code', async (req, res, next) => {
  try {
    const updated = await Industry.findOneAndUpdate(
      { code: req.params.code },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updated)
      return res
        .status(404)
        .json({ success: false, error: 'Industry not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// Delete
router.delete('/:code', async (req, res, next) => {
  try {
    const deleted = await Industry.findOneAndDelete({ code: req.params.code });
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, error: 'Industry not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
