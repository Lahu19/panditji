'use strict';
/**
 * Pandit Provider Portal — all routes require PROVIDER or ADMIN role.
 * Provider identity is ALWAYS derived from the authenticated token,
 * never from request body/params.
 *
 * Mount: /api/pandit-portal
 */
const router              = require('express').Router();
const User                = require('../models/User');
const Provider            = require('../models/Provider');
const ProviderService     = require('../models/ProviderService');
const ProviderAvailability= require('../models/ProviderAvailability');
const ProviderServiceArea = require('../models/ProviderServiceArea');
const Booking             = require('../models/Booking');
const Payment             = require('../models/Payment');
const Review              = require('../models/Review');
const Service             = require('../models/Service');
const Category            = require('../models/Category');
const Notification        = require('../models/Notification');
const AuditLog            = require('../models/AuditLog');
const { authRequired }    = require('../middleware/auth');

/* ─────────────────────────────────────────────
   Guard — must be PROVIDER or ADMIN
───────────────────────────────────────────── */
router.use(authRequired, (req, res, next) => {
  if (!['PROVIDER', 'ADMIN'].includes(req.user?.userType)) {
    return res.status(403).json({
      error: 'Provider access required',
      code:  'NOT_PROVIDER',
    });
  }
  next();
});

/* ─────────────────────────────────────────────
   HELPER — resolve provider doc from auth token.
   Returns { provider } or null.
   Creates a minimal DRAFT provider if one doesn't
   exist yet (first onboarding step).
───────────────────────────────────────────── */
async function getOrCreateProvider(userId) {
  let provider = await Provider.findOne({ userId, isDeleted: false });
  if (!provider) {
    provider = await Provider.create({
      userId,
      displayName: '',
      status:     'PENDING_VERIFICATION',
      createdBy:  userId,
      modifiedBy: userId,
    });
  }
  return provider;
}

/* ─────────────────────────────────────────────
   PROFILE COMPLETION CALCULATOR
   Returns 0-100 integer.
───────────────────────────────────────────── */
function calcCompletion(provider, providerServices, serviceAreas, verifications) {
  const checks = [
    [!!provider.displayName,                                    'displayName', 8],
    [!!(provider.profile?.about?.length >= 20),                'about', 8],
    [!!(provider.profile?.experienceYears > 0),                'experience', 6],
    [!!(provider.profile?.languages?.length > 0),              'languages', 6],
    [!!(provider.profile?.traditions?.length > 0),             'traditions', 4],
    [!!(provider.location?.city),                              'location', 10],
    [!!(providerServices?.length > 0),                         'services', 15],
    [!!(serviceAreas?.length > 0),                             'serviceAreas', 10],
    [!!(provider.pricing?.startingFrom > 0),                   'pricing', 8],
    [!!(provider.media?.length > 0),                           'media', 8],
    [!!(verifications?.some(v => v.status === 'VERIFIED')),    'verification', 10],
    [!!(provider.capabilities),                                'capabilities', 7],
  ];

  const earned = checks.reduce((sum, [pass, , weight]) => sum + (pass ? weight : 0), 0);
  const missing = checks.filter(([pass]) => !pass).map(([, label]) => label);
  return { percent: Math.min(100, earned), missing };
}

/* ─────────────────────────────────────────────
   GET /api/pandit-portal/me
   Returns provider profile + completion.
───────────────────────────────────────────── */
router.get('/me', async (req, res, next) => {
  try {
    const provider = await getOrCreateProvider(req.user.id);
    const [providerServices, serviceAreas] = await Promise.all([
      ProviderService.find({ providerId: provider._id, isDeleted: false })
        .populate('serviceId', 'name categoryId'),
      ProviderServiceArea.find({ providerId: provider._id, isDeleted: false }),
    ]);

    const { percent, missing } = calcCompletion(
      provider, providerServices, serviceAreas, provider.verifications
    );

    const user = await User.findById(req.user.id).select('-passwordHash');

    res.json({ provider, user, providerServices, serviceAreas, completion: { percent, missing } });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────
   PATCH /api/pandit-portal/profile
   Update basic profile fields.
───────────────────────────────────────────── */
router.patch('/profile', async (req, res, next) => {
  try {
    const provider = await getOrCreateProvider(req.user.id);

    /* Fields the provider is allowed to update directly */
    const allowed = [
      'displayName', 'providerType', 'profile',
      'pricing', 'capabilities', 'badges',
    ];
    const update = { modifiedBy: req.user.id, $inc: { version: 1 } };
    for (const k of allowed) {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    }

    const before = {
      displayName: provider.displayName,
      'profile.about': provider.profile?.about,
    };

    const updated = await Provider.findByIdAndUpdate(provider._id, update, { new: true });

    await AuditLog.record({
      entityType: 'Provider', entityId: provider._id,
      action: 'UPDATED',
      actorId: req.user.id, actorType: 'USER',
      before, after: { displayName: updated.displayName },
      ip: req.ip, userAgent: req.headers['user-agent'],
    });

    res.json({ provider: updated });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────
   PATCH /api/pandit-portal/location
   Update provider base location.
───────────────────────────────────────────── */
router.patch('/location', async (req, res, next) => {
  try {
    const provider = await getOrCreateProvider(req.user.id);
    const { city, state, country, coordinates, cityId, stateId, countryId, formattedAddress } = req.body;

    const locationUpdate = {
      'location.city':    city    || provider.location?.city,
      'location.state':   state   || provider.location?.state,
      'location.country': country || provider.location?.country || 'IN',
      'location.type':    'Point',
      modifiedBy: req.user.id,
      $inc: { version: 1 },
    };

    if (coordinates?.latitude && coordinates?.longitude) {
      locationUpdate['location.coordinates'] = [
        parseFloat(coordinates.longitude),
        parseFloat(coordinates.latitude),
      ];
    }

    /* Store normalized IDs for geo matching */
    if (cityId)    locationUpdate['location.cityId']    = cityId;
    if (stateId)   locationUpdate['location.stateId']   = stateId;
    if (countryId) locationUpdate['location.countryId'] = countryId;
    if (formattedAddress) locationUpdate['location.formattedAddress'] = formattedAddress;

    const updated = await Provider.findByIdAndUpdate(provider._id, locationUpdate, { new: true });
    res.json({ provider: updated });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────
   GET /api/pandit-portal/services-catalog
   Returns all active services grouped by category.
───────────────────────────────────────────── */
router.get('/services-catalog', async (req, res, next) => {
  try {
    const [services, categories] = await Promise.all([
      Service.find({ isActive: true, isDeleted: false }).sort({ name: 1 }),
      Category.find({ isActive: true, isDeleted: false }).sort({ displayOrder: 1 }),
    ]);

    /* Group by category */
    const grouped = categories.map(cat => ({
      category: cat,
      services:  services.filter(s => s.categoryId?.toString() === cat._id.toString()),
    })).filter(g => g.services.length > 0);

    res.json({ grouped, services, categories });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────
   GET /api/pandit-portal/my-services
───────────────────────────────────────────── */
router.get('/my-services', async (req, res, next) => {
  try {
    const provider = await getOrCreateProvider(req.user.id);
    const providerServices = await ProviderService.find({ providerId: provider._id, isDeleted: false })
      .populate('serviceId', 'name description categoryId serviceType requirementFields pricing')
      .sort({ createdTime: 1 });
    res.json({ providerServices });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────
   POST /api/pandit-portal/my-services
   Add a service to this provider's profile.
───────────────────────────────────────────── */
router.post('/my-services', async (req, res, next) => {
  try {
    const provider = await getOrCreateProvider(req.user.id);
    const { serviceId, pricing, duration, capabilities, experienceCount, notes } = req.body;

    if (!serviceId) return res.status(400).json({ error: 'serviceId required' });

    /* Prevent duplicates */
    const existing = await ProviderService.findOne({
      providerId: provider._id, serviceId, isDeleted: false,
    });
    if (existing) return res.status(409).json({ error: 'Service already added', providerService: existing });

    const ps = await ProviderService.create({
      providerId:      provider._id,
      serviceId,
      pricing,
      duration,
      capabilities,
      experienceCount: experienceCount || 0,
      notes,
      status:      'ACTIVE',
      createdBy:   req.user.id,
      modifiedBy:  req.user.id,
    });

    /* Keep Provider.serviceIds in sync */
    await Provider.findByIdAndUpdate(provider._id, {
      $addToSet: { serviceIds: serviceId },
      modifiedBy: req.user.id,
    });

    await AuditLog.record({
      entityType: 'Provider', entityId: provider._id,
      action: 'UPDATED',
      actorId: req.user.id, actorType: 'USER',
      after: { serviceAdded: serviceId },
    });

    const populated = await ps.populate('serviceId', 'name categoryId serviceType');
    res.status(201).json({ providerService: populated });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────
   PATCH /api/pandit-portal/my-services/:id
───────────────────────────────────────────── */
router.patch('/my-services/:id', async (req, res, next) => {
  try {
    const provider = await getOrCreateProvider(req.user.id);
    const ps = await ProviderService.findOne({ _id: req.params.id, providerId: provider._id });
    if (!ps) return res.status(404).json({ error: 'Service not found' });

    const allowed = ['pricing', 'duration', 'capabilities', 'experienceCount', 'notes', 'status'];
    const update  = { modifiedBy: req.user.id, $inc: { version: 1 } };
    for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];

    const before = { pricing: ps.pricing };
    const updated = await ProviderService.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('serviceId', 'name categoryId');

    await AuditLog.record({
      entityType: 'Provider', entityId: provider._id,
      action: 'UPDATED', actorId: req.user.id, actorType: 'USER',
      before, after: { pricing: updated.pricing },
    });

    res.json({ providerService: updated });
  } catch (err) { next(err); }
});

/* DELETE /api/pandit-portal/my-services/:id */
router.delete('/my-services/:id', async (req, res, next) => {
  try {
    const provider = await getOrCreateProvider(req.user.id);
    const ps = await ProviderService.findOne({ _id: req.params.id, providerId: provider._id });
    if (!ps) return res.status(404).json({ error: 'Not found' });

    await ProviderService.findByIdAndUpdate(req.params.id, { isDeleted: true, modifiedBy: req.user.id });
    await Provider.findByIdAndUpdate(provider._id, { $pull: { serviceIds: ps.serviceId } });

    res.json({ success: true });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────
   SERVICE AREAS
───────────────────────────────────────────── */
router.get('/service-areas', async (req, res, next) => {
  try {
    const provider = await getOrCreateProvider(req.user.id);
    const areas = await ProviderServiceArea.find({ providerId: provider._id, isDeleted: false });
    res.json({ areas });
  } catch (err) { next(err); }
});

router.post('/service-areas', async (req, res, next) => {
  try {
    const provider = await getOrCreateProvider(req.user.id);
    const area = await ProviderServiceArea.create({
      ...req.body,
      providerId:  provider._id,
      createdBy:   req.user.id,
      modifiedBy:  req.user.id,
    });
    res.status(201).json({ area });
  } catch (err) { next(err); }
});

router.patch('/service-areas/:id', async (req, res, next) => {
  try {
    const provider = await getOrCreateProvider(req.user.id);
    const area = await ProviderServiceArea.findOne({ _id: req.params.id, providerId: provider._id });
    if (!area) return res.status(404).json({ error: 'Not found' });
    const updated = await ProviderServiceArea.findByIdAndUpdate(
      req.params.id,
      { ...req.body, modifiedBy: req.user.id, $inc: { version: 1 } },
      { new: true }
    );
    res.json({ area: updated });
  } catch (err) { next(err); }
});

router.delete('/service-areas/:id', async (req, res, next) => {
  try {
    const provider = await getOrCreateProvider(req.user.id);
    await ProviderServiceArea.findOneAndUpdate(
      { _id: req.params.id, providerId: provider._id },
      { isDeleted: true, modifiedBy: req.user.id }
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────
   AVAILABILITY
───────────────────────────────────────────── */
router.get('/availability', async (req, res, next) => {
  try {
    const provider = await getOrCreateProvider(req.user.id);
    let avail = await ProviderAvailability.findOne({ providerId: provider._id, isDeleted: false });
    if (!avail) {
      /* Sensible defaults: Mon–Sat 8am–7pm */
      avail = {
        workingHours: [0,1,2,3,4,5].map(d => ({
          dayOfWeek: d, startTime: '08:00', endTime: '19:00', isActive: d > 0,
        })),
        blockedRanges: [], bookedSlots: [],
        maxDailyConcurrent: 1, bookingWindowDays: 60, minimumNoticeHours: 24,
      };
    }
    res.json({ availability: avail });
  } catch (err) { next(err); }
});

router.put('/availability', async (req, res, next) => {
  try {
    const provider = await getOrCreateProvider(req.user.id);
    const avail = await ProviderAvailability.findOneAndUpdate(
      { providerId: provider._id },
      {
        ...req.body,
        providerId:  provider._id,
        modifiedBy:  req.user.id,
        $inc:        { version: 1 },
      },
      { upsert: true, new: true, runValidators: true }
    );
    res.json({ availability: avail });
  } catch (err) { next(err); }
});

router.post('/availability/block', async (req, res, next) => {
  try {
    const provider = await getOrCreateProvider(req.user.id);
    const avail = await ProviderAvailability.findOneAndUpdate(
      { providerId: provider._id },
      { $push: { blockedRanges: req.body }, modifiedBy: req.user.id },
      { upsert: true, new: true }
    );
    res.json({ availability: avail });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────
   MEDIA
───────────────────────────────────────────── */
router.post('/media', async (req, res, next) => {
  try {
    const provider = await getOrCreateProvider(req.user.id);
    provider.media.push({ ...req.body, verificationStatus: 'UNVERIFIED', consentStatus: 'GRANTED' });
    provider.modifiedBy = req.user.id;
    await provider.save();
    res.status(201).json({ media: provider.media });
  } catch (err) { next(err); }
});

router.delete('/media/:mediaId', async (req, res, next) => {
  try {
    const provider = await getOrCreateProvider(req.user.id);
    provider.media = provider.media.filter(m => m._id.toString() !== req.params.mediaId);
    provider.modifiedBy = req.user.id;
    await provider.save();
    res.json({ success: true });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────
   SUBMIT FOR VERIFICATION
   PATCH /api/pandit-portal/submit
───────────────────────────────────────────── */
router.patch('/submit', async (req, res, next) => {
  try {
    const provider = await getOrCreateProvider(req.user.id);

    if (provider.status === 'ACTIVE') {
      return res.json({ provider, message: 'Profile already active' });
    }

    const updated = await Provider.findByIdAndUpdate(
      provider._id,
      {
        status:     'PENDING_VERIFICATION',
        modifiedBy: req.user.id,
        $inc:       { version: 1 },
      },
      { new: true }
    );

    await AuditLog.record({
      entityType: 'Provider', entityId: provider._id,
      action: 'UPDATED',
      actorId: req.user.id, actorType: 'USER',
      before: { status: provider.status },
      after:  { status: 'PENDING_VERIFICATION' },
      note: 'Provider submitted for verification',
      ip: req.ip, userAgent: req.headers['user-agent'],
    });

    res.json({ provider: updated, message: 'Submitted for verification' });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────
   BOOKINGS (provider view)
───────────────────────────────────────────── */
router.get('/bookings', async (req, res, next) => {
  try {
    const provider = await getOrCreateProvider(req.user.id);
    const { status, tab = 'upcoming', page = 1, limit = 20 } = req.query;

    const filter = { primaryProviderId: provider._id, isDeleted: false };
    if (status) {
      filter.status = status;
    } else if (tab === 'upcoming') {
      filter.status = { $in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] };
    } else if (tab === 'past') {
      filter.status = { $in: ['COMPLETED', 'CANCELLED', 'DISPUTED'] };
    } else if (tab === 'requests') {
      filter.status = 'PENDING';
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(30, parseInt(limit));
    const lim  = Math.min(30, parseInt(limit));

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort({ 'event.date': tab === 'upcoming' ? 1 : -1 })
        .skip(skip).limit(lim)
        .populate('serviceId', 'name')
        .populate('customerId', 'profile.firstName profile.lastName profile.displayName contact.phone')
        .select('-requirementsSnapshot'),
      Booking.countDocuments(filter),
    ]);

    res.json({ bookings, total, page: parseInt(page), pages: Math.ceil(total / lim) });
  } catch (err) { next(err); }
});

/* GET /api/pandit-portal/bookings/:id */
router.get('/bookings/:id', async (req, res, next) => {
  try {
    const provider = await getOrCreateProvider(req.user.id);
    const booking  = await Booking.findOne({ _id: req.params.id, primaryProviderId: provider._id })
      .populate('serviceId', 'name requirementFields')
      .populate('customerId', 'profile.firstName profile.lastName profile.displayName contact.phone');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json({ booking });
  } catch (err) { next(err); }
});

/* PATCH /api/pandit-portal/bookings/:id/respond
   action: ACCEPT | DECLINE
───────────────────────────────────────────── */
router.patch('/bookings/:id/respond', async (req, res, next) => {
  try {
    const provider = await getOrCreateProvider(req.user.id);
    const { action, reason } = req.body;

    if (!['ACCEPT', 'DECLINE'].includes(action)) {
      return res.status(400).json({ error: 'action must be ACCEPT or DECLINE' });
    }

    const booking = await Booking.findOne({ _id: req.params.id, primaryProviderId: provider._id });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.status !== 'PENDING') {
      return res.status(400).json({ error: `Cannot ${action} a booking with status ${booking.status}` });
    }

    const newStatus = action === 'ACCEPT' ? 'CONFIRMED' : 'CANCELLED';
    const before    = { status: booking.status };

    const updated = await Booking.findByIdAndUpdate(
      booking._id,
      {
        status:     newStatus,
        modifiedBy: req.user.id,
        $inc:       { version: 1 },
        ...(action === 'DECLINE' && reason && {
          'cancellation.reason':    reason,
          'cancellation.initiator': 'PROVIDER',
          'cancellation.cancelledAt': new Date(),
          'cancellation.cancelledBy': req.user.id,
        }),
      },
      { new: true }
    );

    await AuditLog.record({
      entityType: 'Booking', entityId: booking._id,
      action: action === 'ACCEPT' ? 'PROVIDER_ACCEPTED' : 'PROVIDER_DECLINED',
      actorId: req.user.id, actorType: 'USER',
      before, after: { status: newStatus, reason },
      ip: req.ip, userAgent: req.headers['user-agent'],
    });

    res.json({ booking: updated });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────
   EARNINGS
───────────────────────────────────────────── */
router.get('/earnings', async (req, res, next) => {
  try {
    const provider = await getOrCreateProvider(req.user.id);

    const now      = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    /* Payments where this provider is the payee */
    const [allPayments, monthPayments, pendingPayout, bookingCount] = await Promise.all([
      Payment.aggregate([
        { $match: { providerId: provider._id, status: 'PAID', isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: { providerId: provider._id, status: 'PAID', isDeleted: false, paidAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        { $match: { providerId: provider._id, isDeleted: false, 'payout.status': 'PENDING' } },
        { $group: { _id: null, total: { $sum: '$payout.amount' } } },
      ]),
      Booking.countDocuments({ primaryProviderId: provider._id, status: 'COMPLETED' }),
    ]);

    /* Recent payment rows */
    const recentPayments = await Payment.find({ providerId: provider._id, isDeleted: false })
      .sort({ createdTime: -1 })
      .limit(20)
      .populate('bookingId', 'event.date serviceId')
      .lean();

    const totalEarnings  = allPayments[0]?.total  || 0;
    const monthEarnings  = monthPayments[0]?.total || 0;
    const pendingAmount  = pendingPayout[0]?.total || 0;

    /* Platform fee estimate from breakdown */
    const netEarnings = recentPayments.map(p => ({
      ...p,
      netAmount: p.amount - (p.breakdown?.platformFee || 0),
    }));

    const avgBookingValue = bookingCount > 0 ? Math.round(totalEarnings / bookingCount) : 0;

    res.json({
      kpis: {
        totalEarnings,
        monthEarnings,
        pendingPayout: pendingAmount,
        completedBookings: bookingCount,
        avgBookingValue,
      },
      recentPayments: netEarnings,
    });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────
   REVIEWS (provider view)
───────────────────────────────────────────── */
router.get('/reviews', async (req, res, next) => {
  try {
    const provider = await getOrCreateProvider(req.user.id);
    const { page = 1, limit = 10 } = req.query;

    const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(30, parseInt(limit));
    const lim  = Math.min(30, parseInt(limit));

    const [reviews, total, summary] = await Promise.all([
      Review.find({ providerId: provider._id, status: 'PUBLISHED', isDeleted: false })
        .sort({ createdTime: -1 }).skip(skip).limit(lim)
        .populate('customerId', 'profile.displayName profile.firstName')
        .populate('bookingId',  'event.date serviceId'),
      Review.countDocuments({ providerId: provider._id, status: 'PUBLISHED' }),
      Review.aggregate([
        { $match: { providerId: provider._id, status: 'PUBLISHED', isDeleted: false } },
        {
          $group: {
            _id:             null,
            avgPunctuality:  { $avg: '$ratings.punctuality' },
            avgCommunication:{ $avg: '$ratings.communication' },
            avgQuality:      { $avg: '$ratings.serviceQuality' },
            avgProfessionalism: { $avg: '$ratings.professionalism' },
            r5: { $sum: { $cond: [{ $gte: ['$ratings.serviceQuality', 4.5] }, 1, 0] } },
            r4: { $sum: { $cond: [{ $and: [{ $gte: ['$ratings.serviceQuality', 3.5] }, { $lt: ['$ratings.serviceQuality', 4.5] }] }, 1, 0] } },
            r3: { $sum: { $cond: [{ $and: [{ $gte: ['$ratings.serviceQuality', 2.5] }, { $lt: ['$ratings.serviceQuality', 3.5] }] }, 1, 0] } },
            r2: { $sum: { $cond: [{ $and: [{ $gte: ['$ratings.serviceQuality', 1.5] }, { $lt: ['$ratings.serviceQuality', 2.5] }] }, 1, 0] } },
            r1: { $sum: { $cond: [{ $lt:  ['$ratings.serviceQuality', 1.5] }, 1, 0] } },
          },
        },
      ]),
    ]);

    res.json({
      reviews, total, page: parseInt(page), pages: Math.ceil(total / lim),
      summary: summary[0] || null,
      overall: provider.ratingSummary,
    });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────
   NOTIFICATIONS
───────────────────────────────────────────── */
router.get('/notifications', async (req, res, next) => {
  try {
    const { unreadOnly, limit = 30 } = req.query;
    const filter = { userId: req.user.id, isDeleted: false };
    if (unreadOnly === 'true') filter.isRead = false;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdTime: -1 }).limit(parseInt(limit)),
      Notification.countDocuments({ userId: req.user.id, isRead: false, isDeleted: false }),
    ]);

    res.json({ notifications, unreadCount });
  } catch (err) { next(err); }
});

router.patch('/notifications/:id/read', async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true, readAt: new Date() }
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────
   ONBOARDING STEP SAVE
   POST /api/pandit-portal/onboarding/step
   Body: { step: <number>, data: { ... } }
   Merges data into the provider record for the given step.
───────────────────────────────────────────── */
router.post('/onboarding/step', async (req, res, next) => {
  try {
    const { step, data } = req.body;
    const provider = await getOrCreateProvider(req.user.id);

    let updateDoc = { modifiedBy: req.user.id };

    switch (step) {
      case 1: // Basic profile
        if (data.displayName)       updateDoc.displayName      = data.displayName;
        if (data.providerType)      updateDoc.providerType     = data.providerType;
        if (data.profile)           updateDoc.profile          = { ...provider.profile, ...data.profile };
        break;
      case 2: // Location
        if (data.location) {
          updateDoc['location.city']    = data.location.city;
          updateDoc['location.state']   = data.location.state;
          updateDoc['location.country'] = data.location.country || 'IN';
          if (data.location.coordinates) {
            updateDoc['location.coordinates'] = [
              data.location.coordinates.longitude,
              data.location.coordinates.latitude,
            ];
          }
          if (data.location.cityId)    updateDoc['location.cityId']    = data.location.cityId;
          if (data.location.stateId)   updateDoc['location.stateId']   = data.location.stateId;
          if (data.location.countryId) updateDoc['location.countryId'] = data.location.countryId;
        }
        break;
      case 4: // Experience & languages
        if (data.profile) updateDoc.profile = { ...provider.profile, ...data.profile };
        break;
      case 6: // Pricing / capabilities
        if (data.pricing)      updateDoc.pricing      = { ...provider.pricing, ...data.pricing };
        if (data.capabilities) updateDoc.capabilities = { ...provider.capabilities, ...data.capabilities };
        break;
      default:
        break;
    }

    const updated = await Provider.findByIdAndUpdate(provider._id, updateDoc, { new: true });
    res.json({ provider: updated, step });
  } catch (err) { next(err); }
});

module.exports = router;
