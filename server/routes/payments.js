'use strict';
const router   = require('express').Router();
const Payment  = require('../models/Payment');
const Booking  = require('../models/Booking');
const AuditLog = require('../models/AuditLog');
const { authRequired } = require('../middleware/auth');

/* POST /api/payments — initiate payment for a booking */
router.post('/', authRequired, async (req, res, next) => {
  try {
    const { bookingId, method, breakdown } = req.body;
    if (!bookingId) return res.status(400).json({ error: 'bookingId is required' });

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.customerId.toString() !== req.user.id)
      return res.status(403).json({ error: 'Forbidden' });

    /* Check no existing successful payment */
    const existing = await Payment.findOne({ bookingId, status: { $in: ['PAID', 'INITIATED'] } });
    if (existing) return res.status(409).json({ error: 'Payment already exists for this booking', payment: existing });

    const total = booking.pricingSnapshot?.total || 0;

    const payment = await Payment.create({
      bookingId,
      customerId: req.user.id,
      providerId: booking.primaryProviderId,
      amount:     total,
      currency:   booking.pricingSnapshot?.currency || 'INR',
      method:     method || 'UPI',
      breakdown:  breakdown || {
        panditFee:   booking.pricingSnapshot?.items?.find(i => i.itemType === 'PANDIT_FEE')?.totalPrice || 0,
        samagri:     booking.pricingSnapshot?.items?.find(i => i.itemType === 'SAMAGRI')?.totalPrice    || 0,
        travel:      booking.pricingSnapshot?.items?.find(i => i.itemType === 'TRAVEL')?.totalPrice     || 0,
        platformFee: booking.pricingSnapshot?.items?.find(i => i.itemType === 'PLATFORM_FEE')?.totalPrice || 100,
      },
      status:     'INITIATED',
      createdBy:  req.user.id,
      modifiedBy: req.user.id,
    });

    /* Link payment to booking */
    await Booking.findByIdAndUpdate(bookingId, { paymentId: payment._id });

    await AuditLog.record({
      entityType: 'Payment',
      entityId:   payment._id,
      action:     'PAYMENT_INITIATED',
      actorId:    req.user.id,
      actorType:  'USER',
      after:      { amount: total, method },
    });

    res.status(201).json({ payment });
  } catch (err) { next(err); }
});

/* POST /api/payments/:id/confirm — simulate payment confirmation (no real gateway in MVP) */
router.post('/:id/confirm', authRequired, async (req, res, next) => {
  try {
    const { gatewayPaymentId, gatewayOrderId } = req.body;
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (payment.customerId.toString() !== req.user.id)
      return res.status(403).json({ error: 'Forbidden' });
    if (payment.status === 'PAID')
      return res.status(409).json({ error: 'Already paid' });

    const updated = await Payment.findByIdAndUpdate(
      req.params.id,
      {
        status:     'PAID',
        paidAt:     new Date(),
        'gateway.paymentId': gatewayPaymentId || 'SIM_' + Date.now(),
        'gateway.orderId':   gatewayOrderId   || 'ORD_' + Date.now(),
        modifiedBy: req.user.id,
        $inc: { version: 1 },
      },
      { new: true }
    );

    /* Confirm the booking */
    await Booking.findByIdAndUpdate(payment.bookingId, {
      status: 'CONFIRMED',
      modifiedBy: req.user.id,
    });

    await AuditLog.record({
      entityType: 'Payment',
      entityId:   payment._id,
      action:     'PAYMENT_CONFIRMED',
      actorId:    req.user.id,
      actorType:  'USER',
      after:      { status: 'PAID', paidAt: updated.paidAt },
    });

    res.json({ payment: updated });
  } catch (err) { next(err); }
});

/* GET /api/payments — own payments */
router.get('/', authRequired, async (req, res, next) => {
  try {
    const payments = await Payment.find({ customerId: req.user.id })
      .populate('bookingId', 'serviceId event.date status')
      .sort({ createdTime: -1 })
      .limit(50);
    res.json({ payments });
  } catch (err) { next(err); }
});

/* GET /api/payments/:id */
router.get('/:id', authRequired, async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('bookingId', 'serviceId event.date status primaryProviderId')
      .populate('customerId', 'profile contact');
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    const isOwner = payment.customerId._id.toString() === req.user.id;
    if (!isOwner && req.user.userType !== 'ADMIN')
      return res.status(403).json({ error: 'Forbidden' });

    res.json({ payment });
  } catch (err) { next(err); }
});

/* POST /api/payments/:id/refund — initiate refund */
router.post('/:id/refund', authRequired, async (req, res, next) => {
  try {
    const { amount, reason } = req.body;
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (payment.customerId.toString() !== req.user.id && req.user.userType !== 'ADMIN')
      return res.status(403).json({ error: 'Forbidden' });
    if (payment.status !== 'PAID')
      return res.status(400).json({ error: 'Can only refund paid payments' });

    const refundAmt = amount || payment.amount;
    payment.refunds.push({ amount: refundAmt, reason, status: 'PENDING' });
    payment.status     = refundAmt >= payment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
    payment.modifiedBy = req.user.id;
    await payment.save();

    await AuditLog.record({
      entityType: 'Payment',
      entityId:   payment._id,
      action:     'REFUND_INITIATED',
      actorId:    req.user.id,
      actorType:  'USER',
      after:      { refundAmt, reason },
    });

    res.json({ payment });
  } catch (err) { next(err); }
});

module.exports = router;
