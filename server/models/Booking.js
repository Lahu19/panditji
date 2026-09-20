'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

/* ── Booking item (pandit fee, samagri, travel, platform, add-ons) ── */
const bookingItemSchema = new Schema(
  {
    itemType:    { type: String, enum: ['PANDIT_FEE','SAMAGRI','TRAVEL','PLATFORM_FEE','ADDON'], required: true },
    label:       { type: String },
    quantity:    { type: Number, default: 1 },
    unitPrice:   { type: Number, required: true },
    totalPrice:  { type: Number, required: true },
  },
  { _id: false }
);

/* ── Booking provider assignment (for multi-pandit bookings) ── */
const bookingProviderSchema = new Schema(
  {
    providerId: { type: Schema.Types.ObjectId, ref: 'Provider', required: true },
    role:       { type: String, enum: ['PRIMARY','SECONDARY','ASSISTANT'], default: 'PRIMARY' },
    status:     { type: String, enum: ['PENDING','ACCEPTED','DECLINED','COMPLETED'], default: 'PENDING' },
  },
  { _id: false }
);

const bookingSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User',           required: true },
    serviceId:  { type: Schema.Types.ObjectId, ref: 'Service',        required: true },
    requestId:  { type: Schema.Types.ObjectId, ref: 'ServiceRequest' },

    /* Primary provider (first provider or lead Pandit) */
    primaryProviderId: { type: Schema.Types.ObjectId, ref: 'Provider', required: true },

    /* All providers assigned (supports multi-pandit) */
    providers: [bookingProviderSchema],

    event: {
      date:      { type: Date },
      startTime: { type: String },
      endTime:   { type: String },
      location: {
        addressLine1: { type: String },
        addressLine2: { type: String },
        city:    { type: String },
        state:   { type: String },
        country: { type: String, default: 'IN' },
        geo: {
          type: { type: String, enum: ['Point'], default: 'Point' },
          coordinates: { type: [Number], default: [0, 0] },
        },
      },
    },

    /* Immutable snapshots taken at booking time */
    requirementsSnapshot: { type: Schema.Types.Mixed, default: {} },
    pricingSnapshot: {
      items:      [bookingItemSchema],
      subtotal:   { type: Number, default: 0 },
      discount:   { type: Number, default: 0 },
      total:      { type: Number, default: 0 },
      currency:   { type: String, default: 'INR' },
      panditCount:{ type: Number, default: 1 },
    },

    customerDetails: {
      name:    { type: String },
      phone:   { type: String },
      address: { type: String },
      notes:   { type: String },
    },

    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },

    status: {
      type: String,
      enum: [
        'DRAFT',
        'PENDING',
        'CONFIRMED',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
        'DISPUTED',
      ],
      default: 'PENDING',
    },

    cancellation: {
      cancelledAt: { type: Date },
      cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
      reason:      { type: String },
      initiator:   { type: String, enum: ['CUSTOMER','PROVIDER','PLATFORM'] },
    },

    isDeleted:  { type: Boolean, default: false },
    version:    { type: Number,  default: 1 },
    createdBy:  { type: Schema.Types.ObjectId, ref: 'User' },
    modifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: { createdAt: 'createdTime', updatedAt: 'modifiedTime' },
    versionKey: false,
  }
);

bookingSchema.index({ customerId: 1, status: 1 });
bookingSchema.index({ primaryProviderId: 1, status: 1 });
bookingSchema.index({ serviceId: 1 });
bookingSchema.index({ 'event.date': 1 });
bookingSchema.index({ status: 1, isDeleted: 1 });

bookingSchema.pre(/^find/, function () {
  if (this.getFilter().isDeleted === undefined) this.where({ isDeleted: false });
});

module.exports = mongoose.model('Booking', bookingSchema);
