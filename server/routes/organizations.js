'use strict';
const router       = require('express').Router();
const Organization = require('../models/Organization');
const { authRequired } = require('../middleware/auth');

/* POST /api/organizations — create org */
router.post('/', authRequired, async (req, res, next) => {
  try {
    const { name, displayName, description, orgType, contact, address, billing } = req.body;
    if (!name) return res.status(400).json({ error: 'Organization name is required' });

    const org = await Organization.create({
      name, displayName, description, orgType, contact, address, billing,
      members: [{ userId: req.user.id, role: 'OWNER', isActive: true }],
      createdBy:  req.user.id,
      modifiedBy: req.user.id,
    });
    res.status(201).json({ organization: org });
  } catch (err) { next(err); }
});

/* GET /api/organizations/mine — orgs I belong to */
router.get('/mine', authRequired, async (req, res, next) => {
  try {
    const orgs = await Organization.find({
      'members.userId': req.user.id,
      'members.isActive': true,
    }).select('-billing.pan');
    res.json({ organizations: orgs });
  } catch (err) { next(err); }
});

/* GET /api/organizations/:id */
router.get('/:id', authRequired, async (req, res, next) => {
  try {
    const org = await Organization.findById(req.params.id)
      .populate('members.userId', 'profile.displayName profile.firstName contact.email');
    if (!org) return res.status(404).json({ error: 'Organization not found' });

    const isMember = org.members.some(m => m.userId._id?.toString() === req.user.id && m.isActive);
    if (!isMember && req.user.userType !== 'ADMIN')
      return res.status(403).json({ error: 'Forbidden' });

    res.json({ organization: org });
  } catch (err) { next(err); }
});

/* PATCH /api/organizations/:id */
router.patch('/:id', authRequired, async (req, res, next) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ error: 'Organization not found' });

    const member = org.members.find(m => m.userId.toString() === req.user.id);
    if ((!member || member.role !== 'OWNER') && req.user.userType !== 'ADMIN')
      return res.status(403).json({ error: 'Only OWNER or ADMIN can update organization' });

    const forbidden = ['members', 'createdBy'];
    for (const k of forbidden) delete req.body[k];

    const updated = await Organization.findByIdAndUpdate(
      req.params.id,
      { ...req.body, modifiedBy: req.user.id, $inc: { version: 1 } },
      { new: true, runValidators: true }
    );
    res.json({ organization: updated });
  } catch (err) { next(err); }
});

/* POST /api/organizations/:id/members — add member */
router.post('/:id/members', authRequired, async (req, res, next) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ error: 'Organization not found' });

    const requester = org.members.find(m => m.userId.toString() === req.user.id);
    if (!requester || !['OWNER', 'ADMIN'].includes(requester.role))
      return res.status(403).json({ error: 'Forbidden — must be OWNER or ADMIN' });

    const { userId, role } = req.body;
    const existing = org.members.find(m => m.userId.toString() === userId);
    if (existing) {
      existing.isActive = true;
      existing.role = role || existing.role;
    } else {
      org.members.push({ userId, role: role || 'MEMBER', isActive: true });
    }
    org.modifiedBy = req.user.id;
    await org.save();
    res.json({ organization: org });
  } catch (err) { next(err); }
});

/* DELETE /api/organizations/:id/members/:userId — remove member */
router.delete('/:id/members/:userId', authRequired, async (req, res, next) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ error: 'Organization not found' });

    const requester = org.members.find(m => m.userId.toString() === req.user.id);
    const isSelf    = req.params.userId === req.user.id;
    if (!isSelf && (!requester || !['OWNER', 'ADMIN'].includes(requester.role)))
      return res.status(403).json({ error: 'Forbidden' });

    const member = org.members.find(m => m.userId.toString() === req.params.userId);
    if (member) member.isActive = false;

    org.modifiedBy = req.user.id;
    await org.save();
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
