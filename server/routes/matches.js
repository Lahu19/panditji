'use strict';
const router = require('express').Router();
const Match  = require('../models/Match');
const { authRequired } = require('../middleware/auth');

/* GET /api/matches?requestId= — matches for a service request */
router.get('/', authRequired, async (req, res, next) => {
  try {
    const { requestId } = req.query;
    if (!requestId) return res.status(400).json({ error: 'requestId is required' });

    const matches = await Match.find({ requestId, status: 'ACTIVE' })
      .populate('providerId', 'displayName profile pricing capabilities ratingSummary bookingSummary serviceAreas badges verificationStatus eventBreakdown qa')
      .sort({ score: -1 });

    res.json({ matches, total: matches.length });
  } catch (err) { next(err); }
});

/* PATCH /api/matches/:id/select — customer selects a match */
router.patch('/:id/select', authRequired, async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id).populate('requestId');
    if (!match) return res.status(404).json({ error: 'Match not found' });
    if (match.requestId.customerId.toString() !== req.user.id)
      return res.status(403).json({ error: 'Forbidden' });

    await Match.findByIdAndUpdate(req.params.id, { status: 'SELECTED', modifiedBy: req.user.id });

    /* Mark other matches for same request as rejected */
    await Match.updateMany(
      { requestId: match.requestId._id, _id: { $ne: match._id } },
      { status: 'REJECTED', modifiedBy: req.user.id }
    );

    res.json({ success: true, matchId: match._id });
  } catch (err) { next(err); }
});

module.exports = router;
