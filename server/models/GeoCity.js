'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * GeoCity — cities / districts supported on the platform.
 * Stable ID: slugified form e.g. "IN_MP_INDORE"
 */
const geoCitySchema = new Schema(
  {
    _id:          { type: String },          // "IN_MP_INDORE"
    stateId:      { type: String, ref: 'GeoState', required: true },
    countryId:    { type: String, ref: 'GeoCountry', required: true },
    name:         { type: String, required: true, trim: true },
    aliases:      [{ type: String, trim: true }],  // alternate spellings

    /* Representative central coordinate for map display */
    coordinates: {
      latitude:   { type: Number },
      longitude:  { type: Number },
    },

    /* Postal codes that map to this city */
    postalCodes:  [{ type: String }],
    timezone:     { type: String },

    isActive:     { type: Boolean, default: true },
    isDeleted:    { type: Boolean, default: false },
    version:      { type: Number, default: 1 },
    createdBy:    { type: Schema.Types.ObjectId, ref: 'User' },
    modifiedBy:   { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: { createdAt: 'createdTime', updatedAt: 'modifiedTime' },
    versionKey: false,
    _id:        false,
  }
);

geoCitySchema.index({ stateId: 1, name: 1 });
geoCitySchema.index({ countryId: 1 });
geoCitySchema.index({ name: 'text', aliases: 'text' });   // full-text search
geoCitySchema.index({ isActive: 1, isDeleted: 1 });

module.exports = mongoose.model('GeoCity', geoCitySchema);
