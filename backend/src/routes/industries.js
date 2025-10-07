const express = require('express');
const router = express.Router();
const Industry = require('../models/Industry');
const { protect, authorize } = require('../middleware/auth');

// Public list for FE filters/search (only visible)
router.get('/', async (req, res, next) => {
  try {
    const { q, parent, includeHidden } = req.query;
    const filter = {};
    if (!includeHidden) filter.visible = true;
    if (parent) filter.parentCode = parent === 'root' ? null : parent;
    if (q) filter.$text = { $search: q };

    const industries = await Industry.find(filter).sort({
      sortOrder: 1,
      'name.vi': 1,
    });
    res.json({ success: true, data: industries });
  } catch (err) {
    next(err);
  }
});

// Admin CRUD
router.use(protect);
router.use(authorize('admin'));

router.post('/', async (req, res, next) => {
  try {
    const industry = await Industry.create(req.body);
    res.status(201).json({ success: true, data: industry });
  } catch (err) {
    next(err);
  }
});

router.patch('/:code', async (req, res, next) => {
  try {
    const industry = await Industry.findOneAndUpdate(
      { code: req.params.code },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!industry)
      return res
        .status(404)
        .json({ success: false, error: 'Industry not found' });
    res.json({ success: true, data: industry });
  } catch (err) {
    next(err);
  }
});

router.delete('/:code', async (req, res, next) => {
  try {
    const industry = await Industry.findOneAndDelete({ code: req.params.code });
    if (!industry)
      return res
        .status(404)
        .json({ success: false, error: 'Industry not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
