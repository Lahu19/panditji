'use strict';
const router               = require('express').Router();
const ProviderAvailability = require('../models/ProviderAvailability');
const Provider             = require('../models/Provider');
const { authRequired, optionalAuth } = require('../middleware/auth');

/* GET /api/provider-availability/:providerId — fetch availability for a provider */
router.get('/:providerId', optionalAuth, async (req, res, next) => {
  try {
    let avail = await ProviderAvailability.findOne({ providerId: req.params.providerId });

    if (!avail) {
      /* Return sensible defaults — Mon-Sat 8am-7pm */
      return res.json({
        availability: null,
        defaults: {
          workingHours: [1,2,3,4,5,6].map(d => ({ dayOfWeek: d, startTime: '08:00', endTime: '19:00', isActive: true })),
          blockedRanges: [],
          bookedSlots: [],
        },
      });
    }

    res.json({ availability: avail });
  } catch (err) { next(err); }
});

/* PUT /api/provider-availability/:providerId — upsert working hours + blocked ranges */
router.put('/:providerId', authRequired, async (req, res, next) => {
  try {
    /* Verify ownership */
    const provider = await Provider.findById(req.params.providerId).select('userId');
    if (!provider) return res.status(404).json({ error: 'Provider not found' });
    if (provider.userId.toString() !== req.user.id && req.user.userType !== 'ADMIN')
      return res.status(403).json({ error: 'Forbidden' });

    const { workingHours, blockedRanges, maxDailyConcurrent, bookingWindowDays, minimumNoticeHours } = req.body;

    const avail = await ProviderAvailability.findOneAndUpdate(
      { providerId: req.params.providerId },
      {
        providerId: req.params.providerId,
        ...(workingHours         && { workingHours }),
        ...(blockedRanges        && { blockedRanges }),
        ...(maxDailyConcurrent   && { maxDailyConcurrent }),
        ...(bookingWindowDays    && { bookingWindowDays }),
        ...(minimumNoticeHours   && { minimumNoticeHours }),
        modifiedBy: req.user.id,
        $inc: { version: 1 },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.json({ availability: avail });
  } catch (err) { next(err); }
});

/* POST /api/provider-availability/:providerId/block — add a blocked range */
router.post('/:providerId/block', authRequired, async (req, res, next) => {
  try {
    const provider = await Provider.findById(req.params.providerId).select('userId');
    if (!provider) return res.status(404).json({ error: 'Provider not found' });
    if (provider.userId.toString() !== req.user.id && req.user.userType !== 'ADMIN')
      return res.status(403).json({ error: 'Forbidden' });

    const { startDate, endDate, reason } = req.body;
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate required' });

    const avail = await ProviderAvailability.findOneAndUpdate(
      { providerId: req.params.providerId },
      {
        $push: { blockedRanges: { startDate, endDate, reason } },
        modifiedBy: req.user.id,
        $inc: { version: 1 },
      },
      { new: true, upsert: true }
    );

    res.json({ availability: avail });
  } catch (err) { next(err); }
});

/**
 * GET /api/provider-availability/:providerId/slots?date=YYYY-MM-DD
 * Returns available time slots for a specific date.
 */
router.get('/:providerId/slots', optionalAuth, async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'date query param required (YYYY-MM-DD)' });

    const avail = await ProviderAvailability.findOne({ providerId: req.params.providerId });
    const target = new Date(date);
    const dow    = target.getDay();

    /* Check if blocked */
    if (avail?.blockedRanges?.some(r => new Date(r.startDate) <= target && target <= new Date(r.endDate))) {
      return res.json({ slots: [], blocked: true });
    }

    /* Get working hours for this day */
    const wh = avail?.workingHours?.find(h => h.dayOfWeek === dow && h.isActive);
    if (!wh) return res.json({ slots: [], noSchedule: true });

    /* Get already booked slots on this date */
    const booked = avail?.bookedSlots?.filter(s => {
      const d = new Date(s.date);
      return d.toDateString() === target.toDateString();
    }) || [];

    /* Generate 2-hour candidate slots from working hours */
    const slots = [];
    const [startH] = wh.startTime.split(':').map(Number);
    const [endH]   = wh.endTime.split(':').map(Number);

    for (let h = startH; h + 2 <= endH; h++) {
      const slotStart = `${String(h).padStart(2,'0')}:00`;
      const slotEnd   = `${String(h+2).padStart(2,'0')}:00`;
      const isBooked  = booked.some(b => b.startTime === slotStart);
      slots.push({ startTime: slotStart, endTime: slotEnd, available: !isBooked });
    }

    res.json({ slots, date, providerId: req.params.providerId });
  } catch (err) { next(err); }
});

module.exports = router;
