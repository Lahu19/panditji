'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    userId:  { type: Schema.Types.ObjectId, ref: 'User', required: true },

    type: {
      type: String,
      enum: [
        'BOOKING_CONFIRMED',
        'BOOKING_CANCELLED',
        'BOOKING_COMPLETED',
        'PROVIDER_ACCEPTED',
        'PROVIDER_DECLINED',
        'PAYMENT_RECEIVED',
        'PAYMENT_FAILED',
        'REFUND_INITIATED',
        'REVIEW_REMINDER',
        'MESSAGE_RECEIVED',
        'MATCH_READY',
        'SYSTEM',
      ],
      required: true,
    },

    title:   { type: String, required: true },
    body:    { type: String, required: true },

    /* Polymorphic reference — what triggered the notification */
    refType: { type: String, enum: ['Booking', 'ServiceRequest', 'Payment', 'Review', 'Conversation'] },
    refId:   { type: Schema.Types.ObjectId },

    isRead:   { type: Boolean, default: false },
    readAt:   { type: Date },

    channel:  { type: String, enum: ['IN_APP', 'SMS', 'EMAIL', 'PUSH'], default: 'IN_APP' },

    isDeleted:  { type: Boolean, default: false },
    version:    { type: Number, default: 1 },
    createdBy:  { type: Schema.Types.ObjectId, ref: 'User' },
    modifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: { createdAt: 'createdTime', updatedAt: 'modifiedTime' },
    versionKey: false,
  }
);

notificationSchema.index({ userId: 1, isRead: 1, createdTime: -1 });
notificationSchema.index({ userId: 1, isDeleted: 1 });

notificationSchema.pre(/^find/, function () {
  if (this.getFilter().isDeleted === undefined) this.where({ isDeleted: false });
});

module.exports = mongoose.model('Notification', notificationSchema);
