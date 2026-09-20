'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * ProviderService — the join between a Provider and a Service.
 * Stores provider-specific pricing, capabilities, and experience
 * for each service they offer (the "heart of matching" per dbidea.md §12).
 */
const providerServiceSchema = new Schema(
  {
    providerId: { type: Schema.Types.ObjectId, ref: 'Provider', required: true },
    serviceId:  { type: Schema.Types.ObjectId, ref: 'Service',  required: true },

    pricing: {
      model: {
        type: String,
        enum: ['FIXED', 'STARTING_FROM', 'HOURLY', 'PER_PERSON', 'CUSTOM_QUOTE'],
        default: 'STARTING_FROM',
      },
      startingPrice: { type: Number },
      maxPrice:      { type: Number },
      currency:      { type: String, default: 'INR' },
    },

    /* How long the provider typically takes for this service */
    duration: {
      min:   { type: Number },  // minutes
      max:   { type: Number },
      label: { type: String },
    },

    capabilities: {
      providesSamagri:             { type: Boolean, default: false },
      supportsMultipleParticipants: { type: Boolean, default: false },
      acceptsCorporateBookings:    { type: Boolean, default: false },
      acceptsNriBookings:          { type: Boolean, default: false },
    },

    /* Number of times this provider has performed this service */
    experienceCount: { type: Number, default: 0 },

    /* Short provider-specific note about this service */
    notes: { type: String, trim: true, maxlength: 500 },

    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'INACTIVE'],
      default: 'ACTIVE',
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

/* One record per provider+service pair */
providerServiceSchema.index({ providerId: 1, serviceId: 1 }, { unique: true });
providerServiceSchema.index({ serviceId: 1, status: 1 });
providerServiceSchema.index({ providerId: 1, status: 1 });

providerServiceSchema.pre(/^find/, function () {
  if (this.getFilter().isDeleted === undefined) this.where({ isDeleted: false });
});

module.exports = mongoose.model('ProviderService', providerServiceSchema);
