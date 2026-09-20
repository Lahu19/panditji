'use strict';
const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');

function sign(user) {
  return jwt.sign(
    { id: user._id, userType: user.userType },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

/* POST /api/auth/register */
router.post('/register', async (req, res, next) => {
  try {
    const { firstName, lastName, phone, email, password, userType } = req.body;
    if (!password) return res.status(400).json({ error: 'Password is required' });
    if (!phone && !email) return res.status(400).json({ error: 'Phone or email required' });

    const exists = await User.findOne({
      $or: [
        email ? { 'contact.email': email } : null,
        phone ? { 'contact.phone': phone } : null,
      ].filter(Boolean),
    }).select('_id');
    if (exists) return res.status(409).json({ error: 'Account already exists with this phone/email' });

    const user = new User({
      userType: userType || 'CUSTOMER',
      profile: { firstName, lastName, displayName: firstName ? `${firstName} ${lastName || ''}`.trim() : undefined },
      contact: { phone, email },
    });
    await user.setPassword(password);
    await user.save();

    res.status(201).json({ token: sign(user), user: _safe(user) });
  } catch (err) { next(err); }
});

/* POST /api/auth/login */
router.post('/login', async (req, res, next) => {
  try {
    const { phone, email, password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password is required' });

    const query = phone ? { 'contact.phone': phone } : { 'contact.email': email };
    const user  = await User.findOne(query).select('+passwordHash');
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await user.verifyPassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.status !== 'ACTIVE') return res.status(403).json({ error: 'Account is not active' });

    res.json({ token: sign(user), user: _safe(user) });
  } catch (err) { next(err); }
});

/* GET /api/auth/me  — requires token */
router.get('/me', require('../middleware/auth').authRequired, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: _safe(user) });
  } catch (err) { next(err); }
});

function _safe(u) {
  return {
    id: u._id,
    userType: u.userType,
    profile: u.profile,
    contact: { phone: u.contact?.phone, email: u.contact?.email },
    status: u.status,
  };
}

module.exports = router;
