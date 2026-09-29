'use strict';
const router              = require('express').Router();
const ServiceRequest      = require('../models/ServiceRequest');
const Provider            = require('../models/Provider');
const Match               = require('../models/Match');
const ProviderServiceArea = require('../models/ProviderServiceArea');
const AuditLog            = require('../models/AuditLog');
const { authRequired }    = require('../middleware/auth');

/* ─────────────────────────────────────────────
   GEO COVERAGE CHECK
   Returns true if the provider covers the requested location.
   Checks ProviderServiceArea records first; falls back to
   the legacy Provider.serviceAreas string array.
───────────────────────────────────────────── */
async function checkGeoEligibility(provider, requestLocation) {
  if (!requestLocation) return true; // no location = skip geo filter

  const { cityId, areaId, stateId, countryId, coordinates } = requestLocation;

  /* 1. Check ProviderServiceArea records */
  const areas = await ProviderServiceArea.find({
    providerId: provider._id,
    isActive:   true,
    isDeleted:  false,
  });

  if (areas.length > 0) {
    for (const area of areas) {
      if (area.locationType === 'COUNTRY' && area.locationId === countryId) return true;
      if (area.locationType === 'STATE'   && area.locationId === stateId)   return true;
      if (area.locationType === 'CITY'    && area.locationId === cityId)    return true;
      if (area.locationType === 'AREA'    && area.locationId === areaId)    return true;

      if (area.locationType === 'RADIUS' && coordinates && area.radiusKm) {
        /* Haversine distance check */
        const [pLng, pLat] = area.centerPoint?.coordinates || [0, 0];
        const dist = haversineKm(pLat, pLng, coordinates.latitude, coordinates.longitude);
        if (dist <= area.radiusKm) return true;
      }
    }
    /* Provider has explicit service areas but none matched */
    return false;
  }

  /* 2. Fallback: legacy provider.serviceAreas[] string array */
  if (provider.serviceAreas?.length) {
    const cityName  = cityId?.split('_').pop()  || '';
    const areaName  = areaId?.split('_').pop()  || '';
    const stateName = stateId?.split('_').pop() || '';
    const targets   = [cityName, areaName, stateName].filter(Boolean).map(s => s.toLowerCase());
    return provider.serviceAreas.some(sa =>
      targets.some(t => sa.toLowerCase().includes(t) || t.includes(sa.toLowerCase()))
    );
  }

  /* 3. No coverage data at all — include provider (open coverage) */
  return true;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

    /* ── Extract location from request ── */
    const requestLocation = er.location && typeof er.location === 'object'
      ? er.location   // expects { cityId, areaId, stateId, countryId, coordinates }
      : null;

    /* Hard filter: service supported + active status */
    const providerFilter = { status: 'ACTIVE', isDeleted: false };
    if (request.serviceId) providerFilter.serviceIds = request.serviceId;

    /* Geo pre-filter: if we have coordinates, use MongoDB $near for initial radius */
    if (requestLocation?.coordinates?.latitude && requestLocation?.coordinates?.longitude) {
      providerFilter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [requestLocation.coordinates.longitude, requestLocation.coordinates.latitude],
          },
          $maxDistance: 100000, // 100 km initial radius — refined by ProviderServiceArea check
        },
      };
    }

    const preferredLang = er.language && er.language !== 'No preference' ? er.language : null;

    const providers = await Provider.find(providerFilter).select(
      'displayName profile pricing capabilities ratingSummary bookingSummary serviceAreas serviceIds verificationStatus badges location'
    );

    /* Delete old matches for this request */
    await Match.deleteMany({ requestId: request._id });

    const matches = [];
    for (const p of providers) {
      /* ── Geo eligibility check (deterministic) ── */
      const locationCovered = await checkGeoEligibility(p, requestLocation);
      if (!locationCovered) continue; // hard exclude if provider doesn't cover this location

      const langMatch    = !preferredLang || p.profile.languages?.includes(preferredLang);
      const samagriMatch = er.samagri?.startsWith('Yes') ? p.capabilities.samagriAvailable : true;

      /*
       * Scoring:
       *   60  base (service match — already guaranteed by DB filter)
       *   15  language match
       *   15  samagri match
       *   10  rating contribution (up to 10 at 5.0 rating)
       *   +5  verified provider bonus
       */
      let score = 60;
      if (langMatch)    score += 15;
      if (samagriMatch) score += 15;
      score += Math.min(10, Math.round((p.ratingSummary?.overall || 0) * 2));
      if (p.verificationStatus === 'VERIFIED') score += 5;

      const reasons = ['Offers requested service'];
      if (locationCovered)                                reasons.push('Serves your location');
      if (langMatch && preferredLang)                     reasons.push(`${preferredLang}-speaking Pandit`);
      if (samagriMatch && er.samagri?.startsWith('Yes'))  reasons.push('Samagri arrangement available');
      if (p.verificationStatus === 'VERIFIED')            reasons.push('Verified Pandit');
      if ((p.ratingSummary?.overall || 0) >= 4.5)         reasons.push('Top-rated');

      const match = await Match.create({
        requestId:  request._id,
        providerId: p._id,
        eligibility: {
          serviceSupported: true,
          available:        true,
          locationCovered,
          capacityMet:      true,
        },
        preferences: {
          language:  langMatch,
          samagri:   samagriMatch,
          budget:    true,
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

    await AuditLog.record({
      entityType: 'ServiceRequest', entityId: request._id,
      action: 'MATCH_RUN',
      actorId: req.user.id, actorType: 'USER',
      after: { matchCount: matches.length, requestLocation },
    });

    /* Return sorted by score desc */
    matches.sort((a, b) => b.match.score - a.match.score);
    res.json({ matches, total: matches.length });
  } catch (err) { next(err); }
});

module.exports = router;
