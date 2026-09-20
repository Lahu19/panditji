'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * ProviderAvailability — proper slot-based availability model.
 *
 * Replaces the prototype "Sep 20": "available" Map in Provider.
 *
 * Structure:
 *   - Working hours per day-of-week (recurring schedule)
 *   - Blocked date ranges (vacations, blocked days)
 *   - Booked slots (created automatically when a Booking is confirmed)
 */

const workingHourSchema = new Schema(
  {
    /* 0=Sunday, 1=Monday, … 6=Saturday */
    dayOfWeek:  { type: Number, min: 0, max: 6, required: true },
    startTime:  { type: String, required: true }, // "08:00"
    endTime:    { type: String, required: true }, // "18:00"
    isActive:   { type: Boolean, default: true },
  },
  { _id: false }
);

const blockedRangeSchema = new Schema(
  {
    startDate: { type: Date, required: true },
    endDate:   { type: Date, required: true },
    reason:    { type: String },
  },
  { _id: false }
);

const bookedSlotSchema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    date:      { type: Date, required: true },
    startTime: { type: String, required: true },  // "10:00"
    endTime:   { type: String, required: true },  // "13:00"
  },
  { _id: false }
);

const providerAvailabilitySchema = new Schema(
  {
    providerId: { type: Schema.Types.ObjectId, ref: 'Provider', required: true },

    /* Recurring weekly schedule */
    workingHours: [workingHourSchema],

    /* Explicit blocked ranges */
    blockedRanges: [blockedRangeSchema],

    /* Confirmed bookings occupying time */
    bookedSlots: [bookedSlotSchema],

    /* Maximum concurrent bookings on a given day (default 1) */
    maxDailyConcurrent: { type: Number, default: 1 },

    /* Advance booking window in days */
    bookingWindowDays: { type: Number, default: 60 },

    /* Minimum notice required in hours */
    minimumNoticeHours: { type: Number, default: 24 },

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

providerAvailabilitySchema.index({ providerId: 1 });
providerAvailabilitySchema.index({ 'bookedSlots.date': 1 });

providerAvailabilitySchema.pre(/^find/, function () {
  if (this.getFilter().isDeleted === undefined) this.where({ isDeleted: false });
});

module.exports = mongoose.model('ProviderAvailability', providerAvailabilitySchema);
