'use strict';
const router  = require('express').Router();
const Service = require('../models/Service');
const { authRequired } = require('../middleware/auth');

/* GET /api/services — list, filter by category */
router.get('/', async (req, res, next) => {
  try {
    const { categoryId, serviceType, bookable, q } = req.query;
    const filter = { isActive: true };

    if (categoryId)   filter.categoryId   = categoryId;
    if (serviceType)  filter.serviceType  = serviceType;
    if (bookable)     filter.isBookable   = bookable === 'true';
    if (q)            filter.name         = { $regex: q, $options: 'i' };

    const services = await Service.find(filter)
      .populate('categoryId', 'name icon color slug')
      .sort({ name: 1 });

    res.json({ services, total: services.length });
  } catch (err) { next(err); }
});

/* GET /api/services/search?q= — keyword search */
router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ services: [] });

    const services = await Service.find({
      isActive: true,
      $or: [
        { name:        { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { slug:        { $regex: q, $options: 'i' } },
      ],
    }).populate('categoryId', 'name icon color').limit(20);

    res.json({ services });
  } catch (err) { next(err); }
});

/* GET /api/services/:id — accepts ObjectId OR slug */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const isObjectId = /^[a-f\d]{24}$/i.test(id);
    const query = isObjectId ? { _id: id } : { slug: id };
    const svc = await Service.findOne(query).populate('categoryId', 'name icon color slug');
    if (!svc) return res.status(404).json({ error: 'Service not found' });
    res.json({ service: svc });
  } catch (err) { next(err); }
});

/* POST /api/services — admin only */
router.post('/', authRequired, async (req, res, next) => {
  try {
    if (req.user.userType !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
    const svc = await Service.create({ ...req.body, createdBy: req.user.id, modifiedBy: req.user.id });
    res.status(201).json({ service: svc });
  } catch (err) { next(err); }
});

/* PATCH /api/services/:id */
router.patch('/:id', authRequired, async (req, res, next) => {
  try {
    if (req.user.userType !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
    const svc = await Service.findByIdAndUpdate(
      req.params.id,
      { ...req.body, modifiedBy: req.user.id, $inc: { version: 1 } },
      { new: true, runValidators: true }
    );
    if (!svc) return res.status(404).json({ error: 'Service not found' });
    res.json({ service: svc });
  } catch (err) { next(err); }
});

/* DELETE /api/services/:id — soft delete */
router.delete('/:id', authRequired, async (req, res, next) => {
  try {
    if (req.user.userType !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
    await Service.findByIdAndUpdate(req.params.id, { isDeleted: true, modifiedBy: req.user.id });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
