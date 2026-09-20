'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * AuditLog — immutable event trail for important entities.
 *
 * Unlike the 5 audit fields (who changed it last), this answers:
 *   "What changed, when, and why?"
 *
 * Per dbidea.md §30: "Audit fields = current record history metadata"
 *                    "Audit log = actual change/event history"
 */
const auditLogSchema = new Schema(
  {
    /* What entity was affected */
    entityType: {
      type: String,
      enum: ['Booking', 'Payment', 'ServiceRequest', 'Provider', 'User', 'Review', 'Match', 'Organization'],
      required: true,
    },
    entityId: { type: Schema.Types.ObjectId, required: true },

    /* What happened */
    action: {
      type: String,
      enum: [
        'CREATED', 'UPDATED', 'DELETED',
        'STATUS_CHANGED',
        'PAYMENT_INITIATED', 'PAYMENT_CONFIRMED', 'PAYMENT_FAILED', 'REFUND_INITIATED',
        'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'BOOKING_COMPLETED',
        'PROVIDER_ACCEPTED', 'PROVIDER_DECLINED',
        'REVIEW_SUBMITTED', 'REVIEW_FLAGGED',
        'VERIFICATION_PASSED', 'VERIFICATION_FAILED',
        'LOGIN', 'LOGOUT',
        'MATCH_RUN',
      ],
      required: true,
    },

    /* Who did it */
    actorId:   { type: Schema.Types.ObjectId, ref: 'User' },
    actorType: { type: String, enum: ['USER', 'SYSTEM', 'ADMIN', 'WEBHOOK'] },

    /* What changed — before/after snapshot */
    before: { type: Schema.Types.Mixed },
    after:  { type: Schema.Types.Mixed },

    /* Human-readable note */
    note:  { type: String, maxlength: 1000 },

    /* Request metadata */
    ip:         { type: String },
    userAgent:  { type: String },
  },
  {
    /* Audit logs are immutable — no modifiedTime, no soft-delete, no version */
    timestamps: { createdAt: 'createdTime', updatedAt: false },
    versionKey: false,
  }
);

/* Audit logs are append-only — block updates and deletes */
auditLogSchema.pre(['updateOne', 'findOneAndUpdate', 'updateMany', 'findOneAndDelete', 'deleteOne', 'deleteMany'], function () {
  throw new Error('AuditLog records are immutable');
});

auditLogSchema.index({ entityType: 1, entityId: 1, createdTime: -1 });
auditLogSchema.index({ actorId: 1, createdTime: -1 });
auditLogSchema.index({ action: 1, createdTime: -1 });

/**
 * Static helper: log.record({ entityType, entityId, action, actorId, before, after, note })
 * Use this everywhere instead of calling .create() directly.
 */
auditLogSchema.statics.record = function (data) {
  return this.create(data).catch(err => {
    /* Audit log failure should never crash the main flow */
    console.error('AuditLog.record error:', err.message);
  });
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
