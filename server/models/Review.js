'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    bookingId:  { type: Schema.Types.ObjectId, ref: 'Booking',  required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User',     required: true },
    providerId: { type: Schema.Types.ObjectId, ref: 'Provider', required: true },

    ratings: {
      punctuality:     { type: Number, min: 1, max: 5, required: true },
      communication:   { type: Number, min: 1, max: 5, required: true },
      serviceQuality:  { type: Number, min: 1, max: 5, required: true },
      professionalism: { type: Number, min: 1, max: 5, required: true },
    },

    comment: { type: String, trim: true, maxlength: 2000 },

    media: [{ type: String }],  // URLs

    status: {
      type: String,
      enum: ['PENDING','PUBLISHED','FLAGGED','REMOVED'],
      default: 'PUBLISHED',
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

/* One review per booking */
reviewSchema.index({ bookingId: 1 }, { unique: true });
reviewSchema.index({ providerId: 1, status: 1 });
reviewSchema.index({ customerId: 1 });

/* After save — recalculate provider rating summary */
reviewSchema.post('save', async function () {
  try {
    const Provider = mongoose.model('Provider');
    const agg = await mongoose.model('Review').aggregate([
      { $match: { providerId: this.providerId, status: 'PUBLISHED', isDeleted: false } },
      {
        $group: {
          _id: null,
          count:           { $sum: 1 },
          overall:         { $avg: { $avg: ['$ratings.punctuality','$ratings.communication','$ratings.serviceQuality','$ratings.professionalism'] } },
          punctuality:     { $avg: '$ratings.punctuality' },
          communication:   { $avg: '$ratings.communication' },
          serviceQuality:  { $avg: '$ratings.serviceQuality' },
          professionalism: { $avg: '$ratings.professionalism' },
        },
      },
    ]);
    if (agg.length) {
      const round = (n) => Math.round(n * 10) / 10;
      const r = agg[0];
      await Provider.findByIdAndUpdate(this.providerId, {
        'ratingSummary.overall':         round(r.overall),
        'ratingSummary.punctuality':     round(r.punctuality),
        'ratingSummary.communication':   round(r.communication),
        'ratingSummary.serviceQuality':  round(r.serviceQuality),
        'ratingSummary.professionalism': round(r.professionalism),
        'ratingSummary.count':           r.count,
      });
    }
  } catch (e) {
    console.error('Rating recalc error:', e.message);
  }
});

reviewSchema.pre(/^find/, function () {
  if (this.getFilter().isDeleted === undefined) this.where({ isDeleted: false });
});

module.exports = mongoose.model('Review', reviewSchema);
