'use strict';
const router   = require('express').Router();
const Booking  = require('../models/Booking');
const Provider = require('../models/Provider');
const { authRequired } = require('../middleware/auth');

/* POST /api/bookings — create booking */
router.post('/', authRequired, async (req, res, next) => {
  try {
    const {
      serviceId, primaryProviderId, requestId,
      event, customerDetails, pricingSnapshot,
      requirementsSnapshot, panditCount,
    } = req.body;

    if (!serviceId || !primaryProviderId)
      return res.status(400).json({ error: 'serviceId and primaryProviderId are required' });

    const provider = await Provider.findById(primaryProviderId);
    if (!provider) return res.status(404).json({ error: 'Provider not found' });

    /* Build providers array (primary + any extras) */
    const count     = Math.max(1, parseInt(panditCount) || 1);
    const providers = [{ providerId: primaryProviderId, role: 'PRIMARY', status: 'PENDING' }];

    const booking = await Booking.create({
      customerId:        req.user.id,
      serviceId,
      requestId,
      primaryProviderId,
      providers,
      event,
      customerDetails,
      requirementsSnapshot: requirementsSnapshot || {},
      pricingSnapshot: {
        ...pricingSnapshot,
        panditCount: count,
        total: (pricingSnapshot?.total || 0) * count,
      },
      status:     'PENDING',
      createdBy:  req.user.id,
      modifiedBy: req.user.id,
    });

    /* Update provider booking summary */
    await Provider.findByIdAndUpdate(primaryProviderId, {
      $inc: { 'bookingSummary.total': 1 },
    });

    res.status(201).json({ booking });
  } catch (err) { next(err); }
});

/* GET /api/bookings — own bookings (customer or provider) */
router.get('/', authRequired, async (req, res, next) => {
  try {
    const { status, role } = req.query;
    let filter;

    if (role === 'provider') {
      /* Fetch provider profile first */
      const provider = await Provider.findOne({ userId: req.user.id }).select('_id');
      if (!provider) return res.json({ bookings: [] });
      filter = { 'providers.providerId': provider._id };
    } else {
      filter = { customerId: req.user.id };
    }
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('serviceId',         'name slug')
      .populate('primaryProviderId', 'displayName profile.languages ratingSummary')
      .sort({ createdTime: -1 })
      .limit(50);

    res.json({ bookings });
  } catch (err) { next(err); }
});

/* GET /api/bookings/:id */
router.get('/:id', authRequired, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('serviceId',         'name slug categoryId')
      .populate('primaryProviderId', 'displayName profile serviceAreas pricing')
      .populate('customerId',        'profile contact');

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const isCustomer = booking.customerId._id.toString() === req.user.id;
    const providerDoc = await Provider.findOne({ userId: req.user.id }).select('_id');
    const isProvider  = providerDoc && booking.providers.some(p => p.providerId.toString() === providerDoc._id.toString());

    if (!isCustomer && !isProvider && req.user.userType !== 'ADMIN')
      return res.status(403).json({ error: 'Forbidden' });

    res.json({ booking });
  } catch (err) { next(err); }
});

/* PATCH /api/bookings/:id/status — confirm / complete / cancel */
router.patch('/:id/status', authRequired, async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    const validTransitions = {
      PENDING:     ['CONFIRMED', 'CANCELLED'],
      CONFIRMED:   ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['COMPLETED', 'DISPUTED'],
    };

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const allowed = validTransitions[booking.status] || [];
    if (!allowed.includes(status))
      return res.status(400).json({ error: `Cannot transition from ${booking.status} to ${status}` });

    const update = { status, modifiedBy: req.user.id, $inc: { version: 1 } };

    if (status === 'CANCELLED') {
      update.cancellation = {
        cancelledAt: new Date(),
        cancelledBy: req.user.id,
        reason,
        initiator: req.user.userType === 'ADMIN' ? 'PLATFORM' : 'CUSTOMER',
      };
    }

    if (status === 'COMPLETED') {
      /* Increment provider completed count */
      await Provider.findByIdAndUpdate(booking.primaryProviderId, {
        $inc: { 'bookingSummary.completed': 1 },
      });
    }

    const updated = await Booking.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ booking: updated });
  } catch (err) { next(err); }
});

module.exports = router;
