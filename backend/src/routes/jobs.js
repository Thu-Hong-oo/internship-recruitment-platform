const express = require('express');
const router = express.Router();
const Job = require('../models/Job');

router.get('/', async (req, res) => {
  try {
    const { q, city, salaryMin, skills, page = 1, limit = 20, sort = 'postDate' } = req.query;
    const filter = { 'ai.isIntern': true, type: 'intern' };
    if (city) filter['location.city'] = city;
    if (salaryMin) filter['salary.min'] = { $gte: Number(salaryMin) };
    if (skills) filter.skills = { $all: skills.split(',').map(s => s.trim()).filter(Boolean) };

    const sortMap = { postDate: { postDate: -1 }, salary: { 'salary.min': -1 }, relevance: { score: { $meta: 'textScore' } } };
    const projection = q ? { score: { $meta: 'textScore' } } : {};

    const query = q
      ? Job.find(filter, projection).find({ $text: { $search: q } })
      : Job.find(filter, projection);

    const jobs = await query
      .sort(sortMap[sort] || sortMap.postDate)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Job.countDocuments(filter);
    res.json({ data: jobs, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (err) {
    console.error('GET /api/jobs error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;



