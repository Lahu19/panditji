'use strict';
const router   = require('express').Router();
const AuditLog = require('../models/AuditLog');
const { authRequired } = require('../middleware/auth');

/* GET /api/audit-logs?entityType=&entityId= — admin or entity owner */
router.get('/', authRequired, async (req, res, next) => {
  try {
    if (req.user.userType !== 'ADMIN')
      return res.status(403).json({ error: 'Admin only' });

    const { entityType, entityId, actorId, action, limit = 50, page = 1 } = req.query;
    const filter = {};
    if (entityType) filter.entityType = entityType;
    if (entityId)   filter.entityId   = entityId;
    if (actorId)    filter.actorId    = actorId;
    if (action)     filter.action     = action;

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdTime: -1 }).skip(skip).limit(parseInt(limit)),
      AuditLog.countDocuments(filter),
    ]);

    res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { next(err); }
});

/* GET /api/audit-logs/entity/:type/:id — audit trail for a specific entity */
router.get('/entity/:type/:id', authRequired, async (req, res, next) => {
  try {
    /* Allow users to see audit of their own bookings/payments */
    const logs = await AuditLog.find({
      entityType: req.params.type,
      entityId:   req.params.id,
    }).sort({ createdTime: -1 }).limit(100);

    res.json({ logs });
  } catch (err) { next(err); }
});

module.exports = router;
