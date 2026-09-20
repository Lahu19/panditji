'use strict';
const router = require('express').Router();
const { authRequired } = require('../middleware/auth');
const User = require('../models/User');

/* GET /api/users/:id — own profile or admin */
router.get('/:id', authRequired, async (req, res, next) => {
  try {
    if (req.user.id !== req.params.id && req.user.userType !== 'ADMIN')
      return res.status(403).json({ error: 'Forbidden' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) { next(err); }
});

/* PATCH /api/users/:id — update profile */
router.patch('/:id', authRequired, async (req, res, next) => {
  try {
    if (req.user.id !== req.params.id && req.user.userType !== 'ADMIN')
      return res.status(403).json({ error: 'Forbidden' });

    const allowed = ['profile', 'preferences'];
    const update  = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    update.modifiedBy = req.user.id;
    update.$inc = { version: 1 };

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) { next(err); }
});

module.exports = router;
