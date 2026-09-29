'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * GeoArea — localities / areas / neighbourhoods within a city.
 * Stable ID: "IN_MP_INDORE_VIJAY_NAGAR"
 */
const geoAreaSchema = new Schema(
  {
    _id:        { type: String },            // "IN_MP_INDORE_VIJAY_NAGAR"
    cityId:     { type: String, ref: 'GeoCity', required: true },
    stateId:    { type: String, ref: 'GeoState', required: true },
    countryId:  { type: String, ref: 'GeoCountry', required: true },
    name:       { type: String, required: true, trim: true },
    aliases:    [{ type: String, trim: true }],
    postalCode: { type: String },

    coordinates: {
      latitude:  { type: Number },
      longitude: { type: Number },
    },

    /* GeoJSON point for 2dsphere queries */
    geoPoint: {
      type:        { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },  // [lng, lat]
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
    _id:        false,
  }
);

geoAreaSchema.index({ cityId: 1, name: 1 });
geoAreaSchema.index({ stateId: 1 });
geoAreaSchema.index({ geoPoint: '2dsphere' });
geoAreaSchema.index({ name: 'text', aliases: 'text' });
geoAreaSchema.index({ isActive: 1, isDeleted: 1 });

module.exports = mongoose.model('GeoArea', geoAreaSchema);
