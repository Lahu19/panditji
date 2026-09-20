'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const matchSchema = new Schema(
  {
    requestId:  { type: Schema.Types.ObjectId, ref: 'ServiceRequest', required: true },
    providerId: { type: Schema.Types.ObjectId, ref: 'Provider',       required: true },

    /* Hard eligibility checks — all must be true to show provider */
    eligibility: {
      serviceSupported: { type: Boolean, default: false },
      available:        { type: Boolean, default: false },
      locationCovered:  { type: Boolean, default: false },
      capacityMet:      { type: Boolean, default: true },
    },

    /* Soft preference matches — used for sorting / transparency */
    preferences: {
      language:   { type: Boolean },
      samagri:    { type: Boolean },
      budget:     { type: Boolean },
      tradition:  { type: Boolean },
    },

    /* Human-readable reasons shown to customer ("Why this match") */
    matchReasons: [{ type: String }],

    /* Score 0–100 computed server-side; not shown to user as a number */
    score: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ['ACTIVE', 'SELECTED', 'REJECTED', 'EXPIRED'],
      default: 'ACTIVE',
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

matchSchema.index({ requestId: 1, score: -1 });
matchSchema.index({ providerId: 1 });
matchSchema.index({ requestId: 1, providerId: 1 }, { unique: true });

matchSchema.pre(/^find/, function () {
  if (this.getFilter().isDeleted === undefined) this.where({ isDeleted: false });
});

module.exports = mongoose.model('Match', matchSchema);
