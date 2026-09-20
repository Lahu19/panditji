'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const serviceRequestSchema = new Schema(
  {
    customerId:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
    categoryId:  { type: Schema.Types.ObjectId, ref: 'Category' },
    serviceId:   { type: Schema.Types.ObjectId, ref: 'Service' },

    source: {
      type: String,
      enum: ['NATURAL_LANGUAGE', 'BROWSE', 'SEARCH', 'REBOOK', 'DECIDE_FLOW'],
      default: 'NATURAL_LANGUAGE',
    },

    /* Raw text the user typed */
    rawInput: { type: String, trim: true },

    /* Structured requirements extracted from rawInput or answered step-by-step */
    extractedRequirements: {
      serviceName:   { type: String },
      serviceId:     { type: String },          // slug or id string from frontend
      date:          { type: String },
      time:          { type: String },
      language:      { type: String },
      samagri:       { type: String },
      budget:        { type: String },
      location:      { type: String },
      providerCount: { type: Number, default: 1 },
      notes:         { type: String },
      /* Open map for any additional extracted fields */
      extra:         { type: Map, of: Schema.Types.Mixed },
    },

    requirementStatus: {
      type: String,
      enum: ['INCOMPLETE', 'COMPLETE'],
      default: 'INCOMPLETE',
    },

    status: {
      type: String,
      enum: [
        'DRAFT',
        'COLLECTING_REQUIREMENTS',
        'READY_FOR_MATCHING',
        'MATCHING',
        'MATCHED',
        'BOOKED',
        'EXPIRED',
        'CANCELLED',
      ],
      default: 'COLLECTING_REQUIREMENTS',
    },

    expiresAt:  { type: Date },
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

serviceRequestSchema.index({ customerId: 1, status: 1 });
serviceRequestSchema.index({ serviceId: 1 });
serviceRequestSchema.index({ status: 1, isDeleted: 1 });
serviceRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

serviceRequestSchema.pre(/^find/, function () {
  if (this.getFilter().isDeleted === undefined) this.where({ isDeleted: false });
});

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
