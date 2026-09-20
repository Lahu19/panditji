'use strict';
const router          = require('express').Router();
const ProviderService = require('../models/ProviderService');
const Provider        = require('../models/Provider');
const { authRequired, optionalAuth } = require('../middleware/auth');

/* GET /api/provider-services?serviceId=&providerId= */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { serviceId, providerId } = req.query;
    const filter = { status: 'ACTIVE' };
    if (serviceId)  filter.serviceId  = serviceId;
    if (providerId) filter.providerId = providerId;

    const items = await ProviderService.find(filter)
      .populate('providerId', 'displayName profile pricing ratingSummary verificationStatus capabilities serviceAreas')
      .populate('serviceId',  'name slug categoryId pricing.startingFrom')
      .sort({ 'pricing.startingPrice': 1 });

    res.json({ providerServices: items, total: items.length });
  } catch (err) { next(err); }
});

/* GET /api/provider-services/:id */
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const item = await ProviderService.findById(req.params.id)
      .populate('providerId')
      .populate('serviceId');
    if (!item) return res.status(404).json({ error: 'ProviderService not found' });
    res.json({ providerService: item });
  } catch (err) { next(err); }
});

/* POST /api/provider-services — provider adds a service they offer */
router.post('/', authRequired, async (req, res, next) => {
  try {
    /* Resolve provider from current user */
    const provider = await Provider.findOne({ userId: req.user.id }).select('_id');
    if (!provider && req.user.userType !== 'ADMIN')
      return res.status(403).json({ error: 'You must have a provider profile' });

    const providerId = req.body.providerId || provider?._id;

    /* Ensure caller owns this provider */
    if (provider && providerId.toString() !== provider._id.toString() && req.user.userType !== 'ADMIN')
      return res.status(403).json({ error: 'Forbidden' });

    const item = await ProviderService.create({
      ...req.body,
      providerId,
      createdBy:  req.user.id,
      modifiedBy: req.user.id,
    });

    /* Also update provider's flat serviceIds array for quick matching */
    await Provider.findByIdAndUpdate(providerId, {
      $addToSet: { serviceIds: req.body.serviceId },
    });

    res.status(201).json({ providerService: item });
  } catch (err) { next(err); }
});

/* PATCH /api/provider-services/:id */
router.patch('/:id', authRequired, async (req, res, next) => {
  try {
    const item = await ProviderService.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'ProviderService not found' });

    const provider = await Provider.findById(item.providerId).select('userId');
    if (provider?.userId.toString() !== req.user.id && req.user.userType !== 'ADMIN')
      return res.status(403).json({ error: 'Forbidden' });

    const forbidden = ['providerId', 'serviceId'];
    for (const k of forbidden) delete req.body[k];

    const updated = await ProviderService.findByIdAndUpdate(
      req.params.id,
      { ...req.body, modifiedBy: req.user.id, $inc: { version: 1 } },
      { new: true, runValidators: true }
    );
    res.json({ providerService: updated });
  } catch (err) { next(err); }
});

/* DELETE /api/provider-services/:id — soft delete */
router.delete('/:id', authRequired, async (req, res, next) => {
  try {
    const item = await ProviderService.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'ProviderService not found' });

    const provider = await Provider.findById(item.providerId).select('userId');
    if (provider?.userId.toString() !== req.user.id && req.user.userType !== 'ADMIN')
      return res.status(403).json({ error: 'Forbidden' });

    await ProviderService.findByIdAndUpdate(req.params.id, { isDeleted: true, modifiedBy: req.user.id });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
