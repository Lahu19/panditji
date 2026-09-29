'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * ProviderServiceArea — defines WHERE a provider can serve customers.
 *
 * A provider can have multiple coverage records:
 *   - "I serve all of Indore city"        (locationType: CITY,    locationId: "IN_MP_INDORE")
 *   - "I serve Vijay Nagar specifically"  (locationType: AREA,    locationId: "IN_MP_INDORE_VIJAY_NAGAR")
 *   - "I serve anywhere within 25 km"     (locationType: RADIUS,  radiusKm: 25)
 *   - "I serve all of MP"                 (locationType: STATE,   locationId: "IN_MP")
 *
 * During matching the engine checks: does ANY of the provider's
 * service areas cover the customer's requested location?
 */
const providerServiceAreaSchema = new Schema(
  {
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'Provider',
      required: true,
    },

    locationType: {
      type: String,
      enum: ['COUNTRY', 'STATE', 'CITY', 'AREA', 'RADIUS'],
      required: true,
    },

    /* For COUNTRY / STATE / CITY / AREA coverage */
    locationId: { type: String, trim: true },

    /* For RADIUS coverage — provider's base coordinates */
    radiusKm: { type: Number, min: 0, max: 500 },

    /* GeoJSON Point — only used when locationType is RADIUS */
    centerPoint: {
      type:        { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },  // [lng, lat]
    },

    /* Human-readable label for admin UI */
    label: { type: String, trim: true },

    /* Travel charge — km-based or flat */
    travelCharge: {
      model:          { type: String, enum: ['FREE', 'FLAT', 'PER_KM'], default: 'FREE' },
      flatAmount:     { type: Number, default: 0 },
      perKmAmount:    { type: Number, default: 0 },
      freeUpToKm:     { type: Number, default: 0 },
    },

    isActive:   { type: Boolean, default: true },
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

providerServiceAreaSchema.index({ providerId: 1, isActive: 1 });
providerServiceAreaSchema.index({ locationId: 1, locationType: 1 });
providerServiceAreaSchema.index({ centerPoint: '2dsphere' });

module.exports = mongoose.model('ProviderServiceArea', providerServiceAreaSchema);
