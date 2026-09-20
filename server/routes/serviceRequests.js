'use strict';
const router         = require('express').Router();
const ServiceRequest = require('../models/ServiceRequest');
const Provider       = require('../models/Provider');
const Match          = require('../models/Match');
const { authRequired } = require('../middleware/auth');

/* POST /api/service-requests — create new request */
router.post('/', authRequired, async (req, res, next) => {
  try {
    const { source, rawInput, categoryId, serviceId, extractedRequirements } = req.body;

    const request = await ServiceRequest.create({
      customerId: req.user.id,
      source:     source || 'NATURAL_LANGUAGE',
      rawInput,
      categoryId,
      serviceId,
      extractedRequirements: extractedRequirements || {},
      requirementStatus: extractedRequirements ? 'COMPLETE' : 'INCOMPLETE',
      status: 'READY_FOR_MATCHING',
      createdBy:  req.user.id,
      modifiedBy: req.user.id,
      /* Auto-expire after 7 days */
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.status(201).json({ request });
  } catch (err) { next(err); }
});

/* GET /api/service-requests — own requests */
router.get('/', authRequired, async (req, res, next) => {
  try {
    const requests = await ServiceRequest.find({ customerId: req.user.id })
      .populate('categoryId', 'name icon')
      .populate('serviceId',  'name slug')
      .sort({ createdTime: -1 })
      .limit(20);
    res.json({ requests });
  } catch (err) { next(err); }
});

/* GET /api/service-requests/:id */
router.get('/:id', authRequired, async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id)
      .populate('categoryId', 'name icon')
      .populate('serviceId',  'name slug requirementFields');
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const isOwner = request.customerId.toString() === req.user.id;
    if (!isOwner && req.user.userType !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

    res.json({ request });
  } catch (err) { next(err); }
});

/* PATCH /api/service-requests/:id — update requirements */
router.patch('/:id', authRequired, async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.customerId.toString() !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const update = { modifiedBy: req.user.id, $inc: { version: 1 } };
    if (req.body.extractedRequirements) {
      update.extractedRequirements = { ...request.extractedRequirements.toObject?.() || {}, ...req.body.extractedRequirements };
      update.requirementStatus = 'COMPLETE';
      update.status = 'READY_FOR_MATCHING';
    }
    if (req.body.status) update.status = req.body.status;

    const updated = await ServiceRequest.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ request: updated });
  } catch (err) { next(err); }
});

/* POST /api/service-requests/:id/match — run matching engine */
router.post('/:id/match', authRequired, async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.customerId.toString() !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const er = request.extractedRequirements || {};

    /* Hard filter: service supported */
    const providerFilter = { status: 'ACTIVE' };
    if (request.serviceId) providerFilter.serviceIds = request.serviceId;

    /* Language — soft */
    const preferredLang = er.language && er.language !== 'No preference' ? er.language : null;

    const providers = await Provider.find(providerFilter).select(
      'displayName profile pricing capabilities ratingSummary bookingSummary serviceAreas serviceIds verificationStatus badges'
    );

    /* Delete old matches for this request */
    await Match.deleteMany({ requestId: request._id });

    const matches = [];
    for (const p of providers) {
      const langMatch    = !preferredLang || p.profile.languages?.includes(preferredLang);
      const samagriMatch = er.samagri?.startsWith('Yes') ? p.capabilities.samagriAvailable : true;

      /* Score: base 60 for service match, +10 lang, +10 samagri, +20 for rating */
      let score = 60;
      if (langMatch)    score += 10;
      if (samagriMatch) score += 10;
      score += Math.min(20, Math.round((p.ratingSummary?.overall || 0) * 4));

      const reasons = ['Service supported', 'Available in area'];
      if (langMatch && preferredLang)    reasons.push(`${preferredLang}-speaking Pandit`);
      if (samagriMatch && er.samagri?.startsWith('Yes')) reasons.push('Samagri arrangement available');

      const match = await Match.create({
        requestId:  request._id,
        providerId: p._id,
        eligibility: {
          serviceSupported: true,
          available:        true,
          locationCovered:  true,
          capacityMet:      true,
        },
        preferences: {
          language: langMatch,
          samagri:  samagriMatch,
          budget:   true,
          tradition: true,
        },
        matchReasons: reasons,
        score,
        createdBy:  req.user.id,
        modifiedBy: req.user.id,
      });
      matches.push({ match, provider: p });
    }

    await ServiceRequest.findByIdAndUpdate(request._id, {
      status:     'MATCHED',
      modifiedBy: req.user.id,
    });

    /* Return sorted by score desc */
    matches.sort((a, b) => b.match.score - a.match.score);
    res.json({ matches, total: matches.length });
  } catch (err) { next(err); }
});

module.exports = router;
