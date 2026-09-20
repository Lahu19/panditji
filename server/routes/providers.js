'use strict';
const router   = require('express').Router();
const Provider = require('../models/Provider');
const Review   = require('../models/Review');
const { authRequired, optionalAuth } = require('../middleware/auth');

/* ── Helpers ── */
function buildFilter(q) {
  const f = { status: 'ACTIVE' };

  if (q.language)  f['profile.languages'] = { $in: Array.isArray(q.language) ? q.language : [q.language] };
  if (q.samagri === 'true') f['capabilities.samagriAvailable'] = true;
  if (q.verified === 'true') f.verificationStatus = 'VERIFIED';
  if (q.serviceId) f.serviceIds = q.serviceId;

  if (q.ratingMin) f['ratingSummary.overall'] = { $gte: parseFloat(q.ratingMin) };

  if (q.priceMax) f['pricing.startingFrom'] = { ...f['pricing.startingFrom'], $lte: parseInt(q.priceMax) };
  if (q.priceMin) f['pricing.startingFrom'] = { ...f['pricing.startingFrom'], $gte: parseInt(q.priceMin) };

  return f;
}

/* GET /api/providers — list with filters */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const filter = buildFilter(req.query);
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 20);
    const skip   = (page - 1) * limit;

    const sortMap = {
      rating:   { 'ratingSummary.overall': -1 },
      bookings: { 'bookingSummary.completed': -1 },
      price:    { 'pricing.startingFrom': 1 },
    };
    const sort = sortMap[req.query.sort] || { 'ratingSummary.overall': -1 };

    const [providers, total] = await Promise.all([
      Provider.find(filter).sort(sort).skip(skip).limit(limit).select('-media -verifications'),
      Provider.countDocuments(filter),
    ]);

    res.json({ providers, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

/* GET /api/providers/search?q= */
router.get('/search', optionalAuth, async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ providers: [] });

    const providers = await Provider.find({
      status: 'ACTIVE',
      $or: [
        { displayName:          { $regex: q, $options: 'i' } },
        { 'profile.languages':  { $regex: q, $options: 'i' } },
        { serviceAreas:         { $regex: q, $options: 'i' } },
      ],
    }).limit(10).select('displayName profile serviceAreas ratingSummary pricing verified');

    res.json({ providers });
  } catch (err) { next(err); }
});

/* GET /api/providers/:id — accepts ObjectId or slug-style string */
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const isObjectId = /^[a-f\d]{24}$/i.test(id);
    const query = isObjectId ? { _id: id } : { 'profile.slug': id };
    const provider = await Provider.findOne(query)
      .populate('serviceIds', 'name slug categoryId')
      .populate('userId', 'profile.firstName profile.lastName');
    if (!provider) return res.status(404).json({ error: 'Provider not found' });

    const reviews = await Review.find({ providerId: provider._id, status: 'PUBLISHED' })
      .populate('customerId', 'profile.displayName profile.firstName')
      .sort({ createdTime: -1 })
      .limit(10);

    res.json({ provider, reviews });
  } catch (err) { next(err); }
});

/* POST /api/providers — create profile for authenticated user */
router.post('/', authRequired, async (req, res, next) => {
  try {
    const existing = await Provider.findOne({ userId: req.user.id });
    if (existing) return res.status(409).json({ error: 'Provider profile already exists' });

    const provider = await Provider.create({
      ...req.body,
      userId:     req.user.id,
      createdBy:  req.user.id,
      modifiedBy: req.user.id,
    });
    res.status(201).json({ provider });
  } catch (err) { next(err); }
});

/* PATCH /api/providers/:id */
router.patch('/:id', authRequired, async (req, res, next) => {
  try {
    const provider = await Provider.findById(req.params.id);
    if (!provider) return res.status(404).json({ error: 'Provider not found' });

    const isOwner = provider.userId.toString() === req.user.id;
    const isAdmin = req.user.userType === 'ADMIN';
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const forbidden = ['userId', 'ratingSummary', 'bookingSummary'];
    for (const k of forbidden) delete req.body[k];

    const updated = await Provider.findByIdAndUpdate(
      req.params.id,
      { ...req.body, modifiedBy: req.user.id, $inc: { version: 1 } },
      { new: true, runValidators: true }
    );
    res.json({ provider: updated });
  } catch (err) { next(err); }
});

/* POST /api/providers/:id/media — add media item */
router.post('/:id/media', authRequired, async (req, res, next) => {
  try {
    const provider = await Provider.findById(req.params.id);
    if (!provider) return res.status(404).json({ error: 'Provider not found' });
    if (provider.userId.toString() !== req.user.id && req.user.userType !== 'ADMIN')
      return res.status(403).json({ error: 'Forbidden' });

    provider.media.push(req.body);
    provider.modifiedBy = req.user.id;
    await provider.save();
    res.status(201).json({ media: provider.media });
  } catch (err) { next(err); }
});

/* GET /api/providers/:id/availability */
router.get('/:id/availability', async (req, res, next) => {
  try {
    const provider = await Provider.findById(req.params.id).select('availability displayName');
    if (!provider) return res.status(404).json({ error: 'Provider not found' });
    res.json({ availability: provider.availability || {}, providerId: provider._id });
  } catch (err) { next(err); }
});

/* PATCH /api/providers/:id/availability */
router.patch('/:id/availability', authRequired, async (req, res, next) => {
  try {
    const provider = await Provider.findById(req.params.id);
    if (!provider) return res.status(404).json({ error: 'Provider not found' });
    if (provider.userId.toString() !== req.user.id && req.user.userType !== 'ADMIN')
      return res.status(403).json({ error: 'Forbidden' });

    /* req.body.availability is a date→status map */
    const incoming = req.body.availability || {};
    const map = provider.availability || new Map();
    for (const [date, status] of Object.entries(incoming)) {
      map.set(date, status);
    }
    provider.availability = map;
    provider.modifiedBy = req.user.id;
    await provider.save();
    res.json({ availability: Object.fromEntries(provider.availability) });
  } catch (err) { next(err); }
});

module.exports = router;
