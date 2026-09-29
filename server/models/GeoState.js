'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * GeoState — states / provinces / union territories.
 * Stable ID pattern: "<countryId>_<stateCode>" e.g. "IN_MP"
 */
const geoStateSchema = new Schema(
  {
    _id:        { type: String },            // "IN_MP"
    countryId:  { type: String, ref: 'GeoCountry', required: true },
    name:       { type: String, required: true, trim: true },
    code:       { type: String, trim: true }, // "MP"
    timezone:   { type: String },

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

geoStateSchema.index({ countryId: 1, name: 1 });
geoStateSchema.index({ isActive: 1, isDeleted: 1 });

module.exports = mongoose.model('GeoState', geoStateSchema);
