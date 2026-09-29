'use strict';
const router              = require('express').Router();
const GeoCountry          = require('../models/GeoCountry');
const GeoState            = require('../models/GeoState');
const GeoCity             = require('../models/GeoCity');
const GeoArea             = require('../models/GeoArea');
const ProviderServiceArea = require('../models/ProviderServiceArea');
const { authRequired }    = require('../middleware/auth');

/* ─────────────────────────────────────────────
   UTILITY
───────────────────────────────────────────── */

/** Build a normalized location hierarchy object from an area document */
function buildLocationObject(area, city, state, country, source = 'SEARCH') {
  return {
    country: { id: country._id, name: country.name },
    state:   { id: state._id,   name: state.name   },
    city:    { id: city._id,    name: city.name    },
    area:    area ? { id: area._id, name: area.name } : null,
    coordinates: area?.coordinates || city?.coordinates || null,
    postalCode:  area?.postalCode || null,
    formattedAddress: [
      area?.name,
      city?.name,
      state?.name,
      country?.name,
    ].filter(Boolean).join(', '),
    source,
    isVerified: false,
  };
}

/* ─────────────────────────────────────────────
   GET /api/geo/countries
───────────────────────────────────────────── */
router.get('/countries', async (req, res, next) => {
  try {
    const countries = await GeoCountry.find({ isActive: true, isDeleted: false })
      .sort({ name: 1 });
    res.json({ countries });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────
   GET /api/geo/states?countryId=IN
───────────────────────────────────────────── */
router.get('/states', async (req, res, next) => {
  try {
    const filter = { isActive: true, isDeleted: false };
    if (req.query.countryId) filter.countryId = req.query.countryId;
    const states = await GeoState.find(filter).sort({ name: 1 });
    res.json({ states });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────
   GET /api/geo/cities?stateId=IN_MP&countryId=IN
───────────────────────────────────────────── */
router.get('/cities', async (req, res, next) => {
  try {
    const filter = { isActive: true, isDeleted: false };
    if (req.query.stateId)   filter.stateId   = req.query.stateId;
    if (req.query.countryId) filter.countryId = req.query.countryId;
    const cities = await GeoCity.find(filter).sort({ name: 1 });
    res.json({ cities });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────
   GET /api/geo/areas?cityId=IN_MP_INDORE
───────────────────────────────────────────── */
router.get('/areas', async (req, res, next) => {
  try {
    const filter = { isActive: true, isDeleted: false };
    if (req.query.cityId)  filter.cityId  = req.query.cityId;
    if (req.query.stateId) filter.stateId = req.query.stateId;
    const areas = await GeoArea.find(filter).sort({ name: 1 });
    res.json({ areas });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────
   GET /api/geo/search?q=Vijay+Nagar&limit=10
   Searches cities + areas, returns normalized location objects.
───────────────────────────────────────────── */
router.get('/search', async (req, res, next) => {
  try {
    const { q = '', limit = 10 } = req.query;
    if (!q.trim()) return res.json({ results: [] });

    const safeQ   = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex   = new RegExp(safeQ, 'i');
    const lim     = Math.min(parseInt(limit) || 10, 30);

    /* Search areas first (more specific) then cities */
    const [areas, cities] = await Promise.all([
      GeoArea.find({ isActive: true, isDeleted: false, $or: [{ name: regex }, { aliases: regex }] })
        .limit(lim),
      GeoCity.find({ isActive: true, isDeleted: false, $or: [{ name: regex }, { aliases: regex }] })
        .limit(lim),
    ]);

    /* Collect unique state / city / country IDs for batch lookup */
    const cityIds    = [...new Set([...areas.map(a => a.cityId), ...cities.map(c => c._id)])];
    const stateIds   = [...new Set([...areas.map(a => a.stateId), ...cities.map(c => c.stateId)])];
    const countryIds = [...new Set([...areas.map(a => a.countryId), ...cities.map(c => c.countryId)])];

    const [cityDocs, stateDocs, countryDocs] = await Promise.all([
      GeoCity.find({ _id: { $in: cityIds } }),
      GeoState.find({ _id: { $in: stateIds } }),
      GeoCountry.find({ _id: { $in: countryIds } }),
    ]);

    const cityMap    = Object.fromEntries(cityDocs.map(c => [c._id, c]));
    const stateMap   = Object.fromEntries(stateDocs.map(s => [s._id, s]));
    const countryMap = Object.fromEntries(countryDocs.map(c => [c._id, c]));

    const results = [];

    /* Area results — most specific */
    for (const area of areas) {
      const city    = cityMap[area.cityId];
      const state   = stateMap[area.stateId];
      const country = countryMap[area.countryId];
      if (!city || !state || !country) continue;
      results.push({
        type: 'AREA',
        ...buildLocationObject(area, city, state, country, 'SEARCH'),
      });
    }

    /* City results — when no area matches */
    for (const city of cities) {
      const state   = stateMap[city.stateId];
      const country = countryMap[city.countryId];
      if (!state || !country) continue;
      results.push({
        type: 'CITY',
        ...buildLocationObject(null, city, state, country, 'SEARCH'),
      });
    }

    res.json({ results: results.slice(0, lim) });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────
   POST /api/geo/resolve
   Body: { latitude, longitude }
   Reverse-geocodes coordinates to nearest area.
   Uses MongoDB $near on GeoArea.geoPoint (2dsphere).
───────────────────────────────────────────── */
router.post('/resolve', async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'latitude and longitude required' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    /* Find nearest area within 50 km */
    const area = await GeoArea.findOne({
      isActive: true,
      isDeleted: false,
      geoPoint: {
        $near: {
          $geometry:    { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: 50000,   // 50 km in metres
        },
      },
    });

    if (!area) {
      /* Fallback: find nearest city */
      const allAreas = await GeoArea.find({ isActive: true, isDeleted: false });
      if (!allAreas.length) {
        return res.status(404).json({ error: 'No locations found near these coordinates', fallback: true });
      }

      /* If no 2dsphere match (empty DB), just return raw coords */
      return res.status(404).json({
        error: 'Could not resolve location — please search manually',
        fallback: true,
        coordinates: { latitude: lat, longitude: lng },
      });
    }

    const [city, state, country] = await Promise.all([
      GeoCity.findById(area.cityId),
      GeoState.findById(area.stateId),
      GeoCountry.findById(area.countryId),
    ]);

    if (!city || !state || !country) {
      return res.status(404).json({ error: 'Location hierarchy incomplete', fallback: true });
    }

    const location = buildLocationObject(area, city, state, country, 'BROWSER_GPS');
    location.coordinates = { latitude: lat, longitude: lng };  // use actual GPS coords

    res.json({ location });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────
   GET /api/geo/location/:id
   Fetch a single location by area or city ID.
───────────────────────────────────────────── */
router.get('/location/:id', async (req, res, next) => {
  try {
    const id = req.params.id;

    /* Try area first */
    const area = await GeoArea.findById(id);
    if (area) {
      const [city, state, country] = await Promise.all([
        GeoCity.findById(area.cityId),
        GeoState.findById(area.stateId),
        GeoCountry.findById(area.countryId),
      ]);
      return res.json({ location: buildLocationObject(area, city, state, country, 'USER_SELECTED') });
    }

    /* Try city */
    const city = await GeoCity.findById(id);
    if (city) {
      const [state, country] = await Promise.all([
        GeoState.findById(city.stateId),
        GeoCountry.findById(city.countryId),
      ]);
      return res.json({ location: buildLocationObject(null, city, state, country, 'USER_SELECTED') });
    }

    res.status(404).json({ error: 'Location not found' });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────
   ADMIN — Geo CRUD
   All routes below require admin token.
───────────────────────────────────────────── */
function adminOnly(req, res, next) {
  if (req.user?.userType !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
  next();
}

/* POST /api/geo/countries */
router.post('/countries', authRequired, adminOnly, async (req, res, next) => {
  try {
    const country = await GeoCountry.create({ ...req.body, createdBy: req.user.id, modifiedBy: req.user.id });
    res.status(201).json({ country });
  } catch (err) { next(err); }
});

/* PATCH /api/geo/countries/:id */
router.patch('/countries/:id', authRequired, adminOnly, async (req, res, next) => {
  try {
    const country = await GeoCountry.findByIdAndUpdate(
      req.params.id,
      { ...req.body, modifiedBy: req.user.id, $inc: { version: 1 } },
      { new: true, runValidators: true }
    );
    if (!country) return res.status(404).json({ error: 'Country not found' });
    res.json({ country });
  } catch (err) { next(err); }
});

/* POST /api/geo/states */
router.post('/states', authRequired, adminOnly, async (req, res, next) => {
  try {
    const state = await GeoState.create({ ...req.body, createdBy: req.user.id, modifiedBy: req.user.id });
    res.status(201).json({ state });
  } catch (err) { next(err); }
});

/* PATCH /api/geo/states/:id */
router.patch('/states/:id', authRequired, adminOnly, async (req, res, next) => {
  try {
    const state = await GeoState.findByIdAndUpdate(
      req.params.id,
      { ...req.body, modifiedBy: req.user.id, $inc: { version: 1 } },
      { new: true }
    );
    if (!state) return res.status(404).json({ error: 'State not found' });
    res.json({ state });
  } catch (err) { next(err); }
});

/* POST /api/geo/cities */
router.post('/cities', authRequired, adminOnly, async (req, res, next) => {
  try {
    const city = await GeoCity.create({ ...req.body, createdBy: req.user.id, modifiedBy: req.user.id });
    res.status(201).json({ city });
  } catch (err) { next(err); }
});

/* PATCH /api/geo/cities/:id */
router.patch('/cities/:id', authRequired, adminOnly, async (req, res, next) => {
  try {
    const city = await GeoCity.findByIdAndUpdate(
      req.params.id,
      { ...req.body, modifiedBy: req.user.id, $inc: { version: 1 } },
      { new: true }
    );
    if (!city) return res.status(404).json({ error: 'City not found' });
    res.json({ city });
  } catch (err) { next(err); }
});

/* POST /api/geo/areas */
router.post('/areas', authRequired, adminOnly, async (req, res, next) => {
  try {
    const body = { ...req.body, createdBy: req.user.id, modifiedBy: req.user.id };
    /* Auto-populate geoPoint from coordinates if provided */
    if (body.coordinates?.latitude && body.coordinates?.longitude) {
      body.geoPoint = { type: 'Point', coordinates: [body.coordinates.longitude, body.coordinates.latitude] };
    }
    const area = await GeoArea.create(body);
    res.status(201).json({ area });
  } catch (err) { next(err); }
});

/* PATCH /api/geo/areas/:id */
router.patch('/areas/:id', authRequired, adminOnly, async (req, res, next) => {
  try {
    const body = { ...req.body, modifiedBy: req.user.id, $inc: { version: 1 } };
    if (body.coordinates?.latitude && body.coordinates?.longitude) {
      body.geoPoint = { type: 'Point', coordinates: [body.coordinates.longitude, body.coordinates.latitude] };
    }
    const area = await GeoArea.findByIdAndUpdate(req.params.id, body, { new: true });
    if (!area) return res.status(404).json({ error: 'Area not found' });
    res.json({ area });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────
   Provider Service Areas CRUD
───────────────────────────────────────────── */

/* GET /api/geo/provider-service-areas?providerId=xxx */
router.get('/provider-service-areas', async (req, res, next) => {
  try {
    const filter = { isDeleted: false };
    if (req.query.providerId) filter.providerId = req.query.providerId;
    if (req.query.locationId) filter.locationId = req.query.locationId;
    const areas = await ProviderServiceArea.find(filter).populate('providerId', 'displayName');
    res.json({ areas });
  } catch (err) { next(err); }
});

/* POST /api/geo/provider-service-areas */
router.post('/provider-service-areas', authRequired, async (req, res, next) => {
  try {
    const body = { ...req.body, createdBy: req.user.id, modifiedBy: req.user.id };
    if (body.locationType === 'RADIUS' && body.centerPoint?.coordinates) {
      /* Already set by caller */
    }
    const area = await ProviderServiceArea.create(body);
    res.status(201).json({ area });
  } catch (err) { next(err); }
});

/* PATCH /api/geo/provider-service-areas/:id */
router.patch('/provider-service-areas/:id', authRequired, async (req, res, next) => {
  try {
    const area = await ProviderServiceArea.findByIdAndUpdate(
      req.params.id,
      { ...req.body, modifiedBy: req.user.id, $inc: { version: 1 } },
      { new: true }
    );
    if (!area) return res.status(404).json({ error: 'Service area not found' });
    res.json({ area });
  } catch (err) { next(err); }
});

/* DELETE /api/geo/provider-service-areas/:id */
router.delete('/provider-service-areas/:id', authRequired, async (req, res, next) => {
  try {
    await ProviderServiceArea.findByIdAndUpdate(req.params.id, { isDeleted: true, modifiedBy: req.user.id });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
