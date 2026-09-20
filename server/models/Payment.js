'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const refundSchema = new Schema(
  {
    amount:       { type: Number, required: true },
    reason:       { type: String },
    initiatedAt:  { type: Date, default: Date.now },
    completedAt:  { type: Date },
    gatewayRefId: { type: String },
    status:       { type: String, enum: ['PENDING', 'PROCESSED', 'FAILED'], default: 'PENDING' },
  },
  { _id: false }
);

const paymentSchema = new Schema(
  {
    bookingId:  { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User',    required: true },
    providerId: { type: Schema.Types.ObjectId, ref: 'Provider' },

    amount:   { type: Number, required: true },
    currency: { type: String, default: 'INR' },

    method: {
      type: String,
      enum: ['UPI', 'CARD', 'NET_BANKING', 'WALLET', 'CASH', 'BANK_TRANSFER', 'PLATFORM_CREDIT'],
      default: 'UPI',
    },

    /* Fee breakdown */
    breakdown: {
      panditFee:   { type: Number, default: 0 },
      samagri:     { type: Number, default: 0 },
      travel:      { type: Number, default: 0 },
      platformFee: { type: Number, default: 0 },
      discount:    { type: Number, default: 0 },
      tax:         { type: Number, default: 0 },
    },

    /* Gateway details */
    gateway: {
      name:       { type: String },  // razorpay, stripe, etc.
      orderId:    { type: String },
      paymentId:  { type: String },
      signature:  { type: String },
    },

    paidAt:     { type: Date },

    /* Payout to provider */
    payout: {
      amount:       { type: Number },
      scheduledAt:  { type: Date },
      completedAt:  { type: Date },
      bankRef:      { type: String },
      status:       { type: String, enum: ['PENDING', 'SCHEDULED', 'PAID', 'FAILED'], default: 'PENDING' },
    },

    refunds: [refundSchema],

    status: {
      type: String,
      enum: ['PENDING', 'INITIATED', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'],
      default: 'PENDING',
    },

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

paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ customerId: 1, status: 1 });
paymentSchema.index({ providerId: 1 });
paymentSchema.index({ 'gateway.orderId': 1 }, { sparse: true });
paymentSchema.index({ status: 1, isDeleted: 1 });

paymentSchema.pre(/^find/, function () {
  if (this.getFilter().isDeleted === undefined) this.where({ isDeleted: false });
});

module.exports = mongoose.model('Payment', paymentSchema);
