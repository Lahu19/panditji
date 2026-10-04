'use strict';
const router              = require('express').Router();
const User                = require('../models/User');
const Provider            = require('../models/Provider');
const Service             = require('../models/Service');
const Category            = require('../models/Category');
const ServiceRequest      = require('../models/ServiceRequest');
const Match               = require('../models/Match');
const Booking             = require('../models/Booking');
const Payment             = require('../models/Payment');
const Review              = require('../models/Review');
const AuditLog            = require('../models/AuditLog');
const Notification        = require('../models/Notification');
const GeoCity             = require('../models/GeoCity');
const GeoArea             = require('../models/GeoArea');
const ProviderServiceArea = require('../models/ProviderServiceArea');
const { authRequired }    = require('../middleware/auth');

/* ─────────────────────────────────────────────
   Guard — all admin routes require ADMIN role
───────────────────────────────────────────── */
router.use(authRequired, (req, res, next) => {
  if (req.user?.userType !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
});

/* ─────────────────────────────────────────────
   DASHBOARD
   GET /api/admin/dashboard
───────────────────────────────────────────── */
router.get('/dashboard', async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalUsers,
      totalProviders,
      activeProviders,
      pendingVerification,
      todayBookings,
      pendingRequests,
      totalBookings,
      paidPayments,
      cancelledBookings,
      recentBookings,
      serviceBreakdown,
      cityBreakdown,
    ] = await Promise.all([
      User.countDocuments({ isDeleted: false, userType: 'CUSTOMER' }),
      Provider.countDocuments({ isDeleted: false }),
      Provider.countDocuments({ isDeleted: false, status: 'ACTIVE' }),
      Provider.countDocuments({ isDeleted: false, verificationStatus: { $in: ['UNVERIFIED', 'PARTIAL'] } }),
      Booking.countDocuments({ createdTime: { $gte: today, $lt: tomorrow } }),
      ServiceRequest.countDocuments({ isDeleted: false, status: { $in: ['READY_FOR_MATCHING', 'MATCHING'] } }),
      Booking.countDocuments({ isDeleted: false }),
      Payment.aggregate([
        { $match: { status: 'PAID', isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Booking.countDocuments({ isDeleted: false, status: 'CANCELLED' }),

      /* Recent 5 bookings for activity feed */
      Booking.find({ isDeleted: false })
        .sort({ createdTime: -1 })
        .limit(5)
        .populate('customerId', 'profile.displayName profile.firstName')
        .populate('serviceId', 'name')
        .populate('primaryProviderId', 'displayName')
        .select('status event.date createdTime'),

      /* Top services by booking count */
      Booking.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$serviceId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
        { $lookup: { from: 'services', localField: '_id', foreignField: '_id', as: 'service' } },
        { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 1, count: 1, name: '$service.name' } },
      ]),

      /* Bookings by city */
      Booking.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$event.location.city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
    ]);

    const revenue = paidPayments[0]?.total || 0;

    /* Bookings over last 30 days — for trend chart */
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const bookingTrend = await Booking.aggregate([
      { $match: { isDeleted: false, createdTime: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdTime' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      kpis: {
        totalUsers,
        totalProviders,
        activeProviders,
        pendingVerification,
        todayBookings,
        pendingRequests,
        totalBookings,
        revenue,
        cancelledBookings,
      },
      recentBookings,
      serviceBreakdown,
      cityBreakdown,
      bookingTrend,
    });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────
   USERS
   GET /api/admin/users
───────────────────────────────────────────── */
router.get('/users', async (req, res, next) => {
  try {
    const {
      q, userType, status,
      page = 1, limit = 20,
      sortBy = 'createdTime', sortDir = '-1',
    } = req.query;

    const filter = { isDeleted: false };
    if (userType) filter.userType = userType;
    if (status)   filter.status   = status;
    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { 'profile.firstName': regex },
        { 'profile.lastName': regex },
        { 'profile.displayName': regex },
        { 'contact.email': regex },
        { 'contact.phone': regex },
      ];
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(50, parseInt(limit));
    const lim  = Math.min(50, parseInt(limit));
    const sort = { [sortBy]: parseInt(sortDir) };

    const [users, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(lim).select('-passwordHash'),
      User.countDocuments(filter),
    ]);

    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / lim) });
  } catch (err) { next(err); }
});

/* GET /api/admin/users/:id */
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const [bookings, requests] = await Promise.all([
      Booking.find({ customerId: user._id, isDeleted: false }).sort({ createdTime: -1 }).limit(10)
        .populate('serviceId', 'name'),
      ServiceRequest.find({ customerId: user._id, isDeleted: false }).sort({ createdTime: -1 }).limit(5),
    ]);

    res.json({ user, bookings, requests });
  } catch (err) { next(err); }
});

/* PATCH /api/admin/users/:id — update status */
router.patch('/users/:id', async (req, res, next) => {
  try {
    const allowed = ['status', 'userType'];
    const update  = { modifiedBy: req.user.id };
    for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];

    const before = await User.findById(req.params.id).select('-passwordHash');
    const user   = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });

    await AuditLog.record({
      entityType: 'User', entityId: user._id,
      action: 'STATUS_CHANGED',
      actorId: req.user.id, actorType: 'ADMIN',
      before: { status: before.status, userType: before.userType },
      after:  { status: user.status,   userType: user.userType   },
      ip: req.ip, userAgent: req.headers['user-agent'],
    });

    res.json({ user });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────
   PROVIDERS
   GET /api/admin/providers
───────────────────────────────────────────── */
router.get('/providers', async (req, res, next) => {
  try {
    const {
      q, status, verificationStatus,
      city, serviceId, language,
      page = 1, limit = 20,
    } = req.query;

    const filter = { isDeleted: false };
    if (status)             filter.status             = status;
    if (verificationStatus) filter.verificationStatus = verificationStatus;
    if (city)               filter['location.city']   = new RegExp(city, 'i');
    if (serviceId)          filter.serviceIds          = serviceId;
    if (language)           filter['profile.languages']= { $in: [language] };

    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ displayName: regex }, { 'location.city': regex }];
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(50, parseInt(limit));
    const lim  = Math.min(50, parseInt(limit));

    const [providers, total] = await Promise.all([
      Provider.find(filter)
        .sort({ createdTime: -1 })
        .skip(skip).limit(lim)
        .populate('userId', 'contact.email contact.phone profile.firstName profile.lastName')
        .select('-media'),
      Provider.countDocuments(filter),
    ]);

    res.json({ providers, total, page: parseInt(page), pages: Math.ceil(total / lim) });
  } catch (err) { next(err); }
});

/* GET /api/admin/providers/:id */
router.get('/providers/:id', async (req, res, next) => {
  try {
    const provider = await Provider.findById(req.params.id)
      .populate('userId', 'contact.email contact.phone profile')
      .populate('serviceIds', 'name categoryId');
    if (!provider) return res.status(404).json({ error: 'Provider not found' });

    const [serviceAreas, bookings, reviews, auditTrail] = await Promise.all([
      ProviderServiceArea.find({ providerId: provider._id, isDeleted: false }),
      Booking.find({ primaryProviderId: provider._id, isDeleted: false }).sort({ createdTime: -1 }).limit(10)
        .populate('serviceId', 'name').populate('customerId', 'profile.displayName profile.firstName'),
      Review.find({ providerId: provider._id, status: 'PUBLISHED' }).sort({ createdTime: -1 }).limit(5),
      AuditLog.find({ entityType: 'Provider', entityId: provider._id }).sort({ createdTime: -1 }).limit(20),
    ]);

    res.json({ provider, serviceAreas, bookings, reviews, auditTrail });
  } catch (err) { next(err); }
});

/* PATCH /api/admin/providers/:id/verify */
router.patch('/providers/:id/verify', async (req, res, next) => {
  try {
    const { verificationType, status, remarks } = req.body;
    // verificationType: IDENTITY | PHONE | ADDRESS | CREDENTIAL | PROFILE | BACKGROUND
    // status: VERIFIED | FAILED

    const provider = await Provider.findById(req.params.id);
    if (!provider) return res.status(404).json({ error: 'Provider not found' });

    const before = { verificationStatus: provider.verificationStatus };

    /* Update the specific verification entry */
    const idx = provider.verifications.findIndex(v => v.type === verificationType);
    if (idx >= 0) {
      provider.verifications[idx].status     = status;
      provider.verifications[idx].verifiedAt = status === 'VERIFIED' ? new Date() : undefined;
      provider.verifications[idx].verifiedBy = req.user.id;
      provider.verifications[idx].remarks    = remarks;
    } else {
      provider.verifications.push({
        type: verificationType, status,
        verifiedAt: status === 'VERIFIED' ? new Date() : undefined,
        verifiedBy: req.user.id,
        remarks,
      });
    }

    /* Recalculate overall verificationStatus */
    const allVerified  = provider.verifications.every(v => v.status === 'VERIFIED');
    const someVerified = provider.verifications.some(v => v.status === 'VERIFIED');
    provider.verificationStatus = allVerified ? 'VERIFIED' : someVerified ? 'PARTIAL' : 'UNVERIFIED';
    provider.modifiedBy = req.user.id;
    await provider.save();

    await AuditLog.record({
      entityType: 'Provider', entityId: provider._id,
      action: status === 'VERIFIED' ? 'VERIFICATION_PASSED' : 'VERIFICATION_FAILED',
      actorId: req.user.id, actorType: 'ADMIN',
      before,
      after: { verificationStatus: provider.verificationStatus, verificationType, status },
      note: remarks,
      ip: req.ip, userAgent: req.headers['user-agent'],
    });

    res.json({ provider });
  } catch (err) { next(err); }
});

/* PATCH /api/admin/providers/:id/status */
router.patch('/providers/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const before   = await Provider.findById(req.params.id).select('status');
    const provider = await Provider.findByIdAndUpdate(
      req.params.id,
      { status, modifiedBy: req.user.id, $inc: { version: 1 } },
      { new: true }
    );
    if (!provider) return res.status(404).json({ error: 'Provider not found' });

    await AuditLog.record({
      entityType: 'Provider', entityId: provider._id,
      action: 'STATUS_CHANGED',
      actorId: req.user.id, actorType: 'ADMIN',
      before: { status: before.status }, after: { status },
      ip: req.ip, userAgent: req.headers['user-agent'],
    });

    res.json({ provider });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────
   SERVICE REQUESTS
   GET /api/admin/service-requests
───────────────────────────────────────────── */
router.get('/service-requests', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, q } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    if (q) {
      /* Search by request ID */
      if (/^[a-f\d]{24}$/i.test(q)) filter._id = q;
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(50, parseInt(limit));
    const lim  = Math.min(50, parseInt(limit));

    const [requests, total] = await Promise.all([
      ServiceRequest.find(filter)
        .sort({ createdTime: -1 }).skip(skip).limit(lim)
        .populate('customerId', 'profile.displayName profile.firstName contact.phone')
        .populate('serviceId', 'name')
        .populate('categoryId', 'name'),
      ServiceRequest.countDocuments(filter),
    ]);

    res.json({ requests, total, page: parseInt(page), pages: Math.ceil(total / lim) });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────
   MATCHES
   GET /api/admin/matches?requestId=xxx
───────────────────────────────────────────── */
router.get('/matches', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.requestId) filter.requestId = req.query.requestId;
    if (req.query.status)    filter.status    = req.query.status;

    const matches = await Match.find(filter)
      .sort({ score: -1 })
      .populate('providerId', 'displayName location profile.languages ratingSummary verificationStatus')
      .populate('requestId', 'status serviceId customerId');

    res.json({ matches });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────
   BOOKINGS
   GET /api/admin/bookings
───────────────────────────────────────────── */
router.get('/bookings', async (req, res, next) => {
  try {
    const {
      status, city, serviceId, providerId,
      dateFrom, dateTo, paymentStatus,
      page = 1, limit = 20, q,
    } = req.query;

    const filter = { isDeleted: false };
    if (status)    filter.status = status;
    if (city)      filter['event.location.city'] = new RegExp(city, 'i');
    if (serviceId) filter.serviceId = serviceId;
    if (providerId) filter.primaryProviderId = providerId;
    if (dateFrom || dateTo) {
      filter['event.date'] = {};
      if (dateFrom) filter['event.date'].$gte = new Date(dateFrom);
      if (dateTo)   filter['event.date'].$lte = new Date(dateTo);
    }
    if (q && /^[a-f\d]{24}$/i.test(q)) filter._id = q;

    const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(50, parseInt(limit));
    const lim  = Math.min(50, parseInt(limit));

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort({ createdTime: -1 }).skip(skip).limit(lim)
        .populate('customerId', 'profile.displayName profile.firstName contact.phone')
        .populate('serviceId', 'name')
        .populate('primaryProviderId', 'displayName location.city'),
      Booking.countDocuments(filter),
    ]);

    /* Join payment status if requested */
    let result = bookings;
    if (paymentStatus) {
      const bookingIds = bookings.map(b => b._id);
      const payments   = await Payment.find({ bookingId: { $in: bookingIds }, status: paymentStatus });
      const paid       = new Set(payments.map(p => p.bookingId.toString()));
      result           = bookings.filter(b => paid.has(b._id.toString()));
    }

    res.json({ bookings: result, total, page: parseInt(page), pages: Math.ceil(total / lim) });
  } catch (err) { next(err); }
});

/* GET /api/admin/bookings/:id */
router.get('/bookings/:id', async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customerId', 'profile contact')
      .populate('serviceId', 'name')
      .populate('primaryProviderId', 'displayName location profile')
      .populate('paymentId');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const [auditTrail] = await Promise.all([
      AuditLog.find({ entityType: 'Booking', entityId: booking._id }).sort({ createdTime: -1 }),
    ]);

    res.json({ booking, auditTrail });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────
   PAYMENTS
   GET /api/admin/payments
───────────────────────────────────────────── */
router.get('/payments', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;

    const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(50, parseInt(limit));
    const lim  = Math.min(50, parseInt(limit));

    const [payments, total, summary] = await Promise.all([
      Payment.find(filter)
        .sort({ createdTime: -1 }).skip(skip).limit(lim)
        .populate('customerId', 'profile.displayName profile.firstName contact.phone')
        .populate('bookingId', 'status event.date'),
      Payment.countDocuments(filter),
      Payment.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: '$status',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    res.json({ payments, total, page: parseInt(page), pages: Math.ceil(total / lim), summary });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────
   REVIEWS
   GET /api/admin/reviews
───────────────────────────────────────────── */
router.get('/reviews', async (req, res, next) => {
  try {
    const { status, providerId, page = 1, limit = 20 } = req.query;
    const filter = { isDeleted: false };
    if (status)     filter.status     = status;
    if (providerId) filter.providerId = providerId;

    const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(50, parseInt(limit));
    const lim  = Math.min(50, parseInt(limit));

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .sort({ createdTime: -1 }).skip(skip).limit(lim)
        .populate('customerId', 'profile.displayName profile.firstName')
        .populate('providerId', 'displayName')
        .populate('bookingId', 'event.date serviceId'),
      Review.countDocuments(filter),
    ]);

    res.json({ reviews, total, page: parseInt(page), pages: Math.ceil(total / lim) });
  } catch (err) { next(err); }
});

/* PATCH /api/admin/reviews/:id/moderate */
router.patch('/reviews/:id/moderate', async (req, res, next) => {
  try {
    const { action, note } = req.body;
    // action: 'FLAG' | 'HIDE' | 'RESTORE'
    const statusMap = { FLAG: 'FLAGGED', HIDE: 'REMOVED', RESTORE: 'PUBLISHED' };
    const newStatus = statusMap[action];
    if (!newStatus) return res.status(400).json({ error: 'Invalid action' });

    const before = await Review.findById(req.params.id);
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status: newStatus, modifiedBy: req.user.id, $inc: { version: 1 } },
      { new: true }
    );
    if (!review) return res.status(404).json({ error: 'Review not found' });

    await AuditLog.record({
      entityType: 'Review', entityId: review._id,
      action: 'REVIEW_FLAGGED',
      actorId: req.user.id, actorType: 'ADMIN',
      before: { status: before.status }, after: { status: newStatus },
      note,
      ip: req.ip, userAgent: req.headers['user-agent'],
    });

    res.json({ review });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────
   AUDIT LOGS  (admin supplement — more filters)
   GET /api/admin/audit-logs
───────────────────────────────────────────── */
router.get('/audit-logs', async (req, res, next) => {
  try {
    const {
      entityType, entityId, actorId, action,
      dateFrom, dateTo,
      page = 1, limit = 30,
    } = req.query;

    const filter = {};
    if (entityType) filter.entityType = entityType;
    if (entityId)   filter.entityId   = entityId;
    if (actorId)    filter.actorId    = actorId;
    if (action)     filter.action     = action;
    if (dateFrom || dateTo) {
      filter.createdTime = {};
      if (dateFrom) filter.createdTime.$gte = new Date(dateFrom);
      if (dateTo)   filter.createdTime.$lte = new Date(dateTo);
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(100, parseInt(limit));
    const lim  = Math.min(100, parseInt(limit));

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdTime: -1 }).skip(skip).limit(lim)
        .populate('actorId', 'profile.displayName profile.firstName userType'),
      AuditLog.countDocuments(filter),
    ]);

    res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / lim) });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────
   LOCATION STATS (for location management page)
   GET /api/admin/location-stats?cityId=IN_MP_INDORE
───────────────────────────────────────────── */
router.get('/location-stats', async (req, res, next) => {
  try {
    const { cityId } = req.query;

    const cityRegex = cityId
      ? new RegExp(cityId.split('_').pop(), 'i')  // e.g. "INDORE" → /INDORE/i
      : /.*/;

    const [providerCount, bookingCount, requestCount] = await Promise.all([
      Provider.countDocuments({ isDeleted: false, 'location.city': cityRegex }),
      Booking.countDocuments({ isDeleted: false, 'event.location.city': cityRegex }),
      ServiceRequest.countDocuments({ isDeleted: false }),
    ]);

    /* Providers per city — cross-cutting */
    const cityBreakdown = await Provider.aggregate([
      { $match: { isDeleted: false, status: 'ACTIVE' } },
      { $group: { _id: '$location.city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    res.json({ providerCount, bookingCount, requestCount, cityBreakdown });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────
   SERVICES MANAGEMENT
   GET /api/admin/services
───────────────────────────────────────────── */
router.get('/services', async (req, res, next) => {
  try {
    const { categoryId, isActive, page = 1, limit = 30, q } = req.query;
    const filter = { isDeleted: false };
    if (categoryId) filter.categoryId = categoryId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (q) filter.$or = [
      { name: new RegExp(q, 'i') },
      { description: new RegExp(q, 'i') },
    ];

    const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(50, parseInt(limit));
    const lim  = Math.min(50, parseInt(limit));

    const [services, total] = await Promise.all([
      Service.find(filter).sort({ name: 1 }).skip(skip).limit(lim)
        .populate('categoryId', 'name'),
      Service.countDocuments(filter),
    ]);

    res.json({ services, total, page: parseInt(page), pages: Math.ceil(total / lim) });
  } catch (err) { next(err); }
});

/* GET /api/admin/services/:id — full service including requirementFields */
router.get('/services/:id', async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('categoryId', 'name icon');
    if (!service) return res.status(404).json({ error: 'Service not found' });

    const [providerCount, bookingCount] = await Promise.all([
      Provider.countDocuments({ serviceIds: service._id, isDeleted: false }),
      Booking.countDocuments({ serviceId: service._id, isDeleted: false }),
    ]);

    res.json({ service, providerCount, bookingCount });
  } catch (err) { next(err); }
});

module.exports = router;
