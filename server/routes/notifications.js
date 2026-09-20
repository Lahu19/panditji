'use strict';
const router       = require('express').Router();
const Notification = require('../models/Notification');
const { authRequired } = require('../middleware/auth');

/* GET /api/notifications — own notifications */
router.get('/', authRequired, async (req, res, next) => {
  try {
    const { unreadOnly, limit = 30 } = req.query;
    const filter = { userId: req.user.id };
    if (unreadOnly === 'true') filter.isRead = false;

    const notifications = await Notification.find(filter)
      .sort({ createdTime: -1 })
      .limit(Math.min(100, parseInt(limit)));

    const unreadCount = await Notification.countDocuments({ userId: req.user.id, isRead: false });

    res.json({ notifications, unreadCount });
  } catch (err) { next(err); }
});

/* PATCH /api/notifications/:id/read — mark single as read */
router.patch('/:id/read', authRequired, async (req, res, next) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) return res.status(404).json({ error: 'Notification not found' });
    if (notif.userId.toString() !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    notif.isRead   = true;
    notif.readAt   = new Date();
    notif.modifiedBy = req.user.id;
    await notif.save();
    res.json({ notification: notif });
  } catch (err) { next(err); }
});

/* PATCH /api/notifications/read-all — mark all as read */
router.patch('/read-all', authRequired, async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true, readAt: new Date(), modifiedBy: req.user.id }
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

/* DELETE /api/notifications/:id — soft delete */
router.delete('/:id', authRequired, async (req, res, next) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) return res.status(404).json({ error: 'Notification not found' });
    if (notif.userId.toString() !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    await Notification.findByIdAndUpdate(req.params.id, { isDeleted: true, modifiedBy: req.user.id });
    res.json({ success: true });
  } catch (err) { next(err); }
});

/**
 * Internal helper — not an HTTP route.
 * Usage: require('./notifications').createNotification(...)
 */
async function createNotification({ userId, type, title, body, refType, refId, channel }) {
  try {
    return await Notification.create({ userId, type, title, body, refType, refId, channel: channel || 'IN_APP' });
  } catch (err) {
    console.error('createNotification error:', err.message);
  }
}

router.createNotification = createNotification;
module.exports = router;
