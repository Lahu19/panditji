'use strict';
const router   = require('express').Router();
const Review   = require('../models/Review');
const Booking  = require('../models/Booking');
const Provider = require('../models/Provider');
const { authRequired } = require('../middleware/auth');

/* POST /api/reviews — submit review after booking */
router.post('/', authRequired, async (req, res, next) => {
  try {
    const { bookingId, ratings, comment, media } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.customerId.toString() !== req.user.id)
      return res.status(403).json({ error: 'You can only review your own bookings' });
    if (booking.status !== 'COMPLETED')
      return res.status(400).json({ error: 'Can only review completed bookings' });

    const existing = await Review.findOne({ bookingId });
    if (existing) return res.status(409).json({ error: 'Review already submitted for this booking' });

    const review = await Review.create({
      bookingId,
      customerId:  req.user.id,
      providerId:  booking.primaryProviderId,
      ratings,
      comment,
      media:       media || [],
      status:      'PUBLISHED',
      createdBy:   req.user.id,
      modifiedBy:  req.user.id,
    });

    /* Update provider repeat customers if applicable */
    const repeatCount = await Booking.countDocuments({
      customerId:        req.user.id,
      primaryProviderId: booking.primaryProviderId,
      status:            'COMPLETED',
    });
    if (repeatCount > 1) {
      await Provider.findByIdAndUpdate(booking.primaryProviderId, {
        $inc: { 'bookingSummary.repeatCustomers': 1 },
      });
    }

    res.status(201).json({ review });
  } catch (err) { next(err); }
});

/* GET /api/reviews?providerId= — reviews for a provider */
router.get('/', async (req, res, next) => {
  try {
    const { providerId, customerId, status } = req.query;
    const filter = { status: status || 'PUBLISHED' };
    if (providerId) filter.providerId = providerId;
    if (customerId) filter.customerId = customerId;

    const reviews = await Review.find(filter)
      .populate('customerId', 'profile.displayName profile.firstName')
      .populate('bookingId',  'serviceId event.date')
      .sort({ createdTime: -1 })
      .limit(50);

    res.json({ reviews, total: reviews.length });
  } catch (err) { next(err); }
});

/* GET /api/reviews/:id */
router.get('/:id', async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('customerId', 'profile')
      .populate('providerId', 'displayName');
    if (!review) return res.status(404).json({ error: 'Review not found' });
    res.json({ review });
  } catch (err) { next(err); }
});

module.exports = router;
