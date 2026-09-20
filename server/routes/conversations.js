'use strict';
const router       = require('express').Router();
const Conversation = require('../models/Conversation');
const Provider     = require('../models/Provider');
const { authRequired } = require('../middleware/auth');

/* POST /api/conversations — start or get existing conversation */
router.post('/', authRequired, async (req, res, next) => {
  try {
    const { otherUserId, bookingId, requestId } = req.body;
    if (!otherUserId) return res.status(400).json({ error: 'otherUserId is required' });

    /* Participants sorted so the same pair always produces the same doc */
    const participants = [req.user.id, otherUserId].sort();

    let convo = await Conversation.findOne({
      participants: { $all: participants, $size: 2 },
      isDeleted: false,
    });

    if (!convo) {
      convo = await Conversation.create({
        participants,
        bookingId,
        requestId,
        createdBy:  req.user.id,
        modifiedBy: req.user.id,
      });
    }

    res.status(201).json({ conversation: convo });
  } catch (err) { next(err); }
});

/* GET /api/conversations — all conversations for current user */
router.get('/', authRequired, async (req, res, next) => {
  try {
    const convos = await Conversation.find({
      participants: req.user.id,
      status: 'ACTIVE',
    })
      .populate('participants', 'profile.displayName profile.firstName')
      .sort({ lastMessageAt: -1 })
      .limit(50);

    res.json({ conversations: convos });
  } catch (err) { next(err); }
});

/* GET /api/conversations/:id — messages in a thread */
router.get('/:id', authRequired, async (req, res, next) => {
  try {
    const convo = await Conversation.findById(req.params.id)
      .populate('participants', 'profile.displayName profile.firstName');
    if (!convo) return res.status(404).json({ error: 'Conversation not found' });

    const isMember = convo.participants.some(p => (p._id || p).toString() === req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Forbidden' });

    /* Mark messages from the other participant as read */
    let changed = false;
    for (const msg of convo.messages) {
      if (!msg.isRead && msg.senderId.toString() !== req.user.id) {
        msg.isRead = true;
        msg.readAt = new Date();
        changed = true;
      }
    }
    /* Reset unread count for current user */
    if (changed || (convo.unreadCounts.get(req.user.id) || 0) > 0) {
      convo.unreadCounts.set(req.user.id, 0);
      convo.modifiedBy = req.user.id;
      await convo.save();
    }

    res.json({ conversation: convo });
  } catch (err) { next(err); }
});

/* POST /api/conversations/:id/messages — send a message */
router.post('/:id/messages', authRequired, async (req, res, next) => {
  try {
    const { body, mediaUrl } = req.body;
    if (!body && !mediaUrl) return res.status(400).json({ error: 'Message body or mediaUrl required' });

    const convo = await Conversation.findById(req.params.id);
    if (!convo) return res.status(404).json({ error: 'Conversation not found' });

    const isMember = convo.participants.some(p => p.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Forbidden' });

    const message = { senderId: req.user.id, body, mediaUrl };
    convo.messages.push(message);
    convo.lastMessageAt   = new Date();
    convo.lastMessageBody = (body || '').slice(0, 200);
    convo.modifiedBy      = req.user.id;

    /* Increment unread counts for all other participants */
    for (const pid of convo.participants) {
      if (pid.toString() !== req.user.id) {
        convo.unreadCounts.set(pid.toString(), (convo.unreadCounts.get(pid.toString()) || 0) + 1);
      }
    }

    await convo.save();
    const sent = convo.messages[convo.messages.length - 1];
    res.status(201).json({ message: sent });
  } catch (err) { next(err); }
});

/* PATCH /api/conversations/:id/archive */
router.patch('/:id/archive', authRequired, async (req, res, next) => {
  try {
    const convo = await Conversation.findById(req.params.id);
    if (!convo) return res.status(404).json({ error: 'Conversation not found' });

    const isMember = convo.participants.some(p => p.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Forbidden' });

    await Conversation.findByIdAndUpdate(req.params.id, { status: 'ARCHIVED', modifiedBy: req.user.id });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
