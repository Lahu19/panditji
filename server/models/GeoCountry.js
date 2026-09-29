'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * GeoCountry — master list of countries supported by the platform.
 * Stable ID = ISO 3166-1 alpha-2 code (e.g. "IN", "US", "GB").
 */
const geoCountrySchema = new Schema(
  {
    _id:         { type: String },           // ISO alpha-2: "IN"
    name:        { type: String, required: true, trim: true },
    officialName:{ type: String, trim: true },
    dialCode:    { type: String },           // "+91"
    currencyCode:{ type: String },           // "INR"
    currencySymbol:{ type: String },         // "₹"
    languages:   [{ type: String }],         // ["hi","en"]
    timezone:    { type: String },           // primary TZ, e.g. "Asia/Kolkata"
    flagEmoji:   { type: String },

    isActive:    { type: Boolean, default: true },
    isDeleted:   { type: Boolean, default: false },
    version:     { type: Number, default: 1 },
    createdBy:   { type: Schema.Types.ObjectId, ref: 'User' },
    modifiedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps:  { createdAt: 'createdTime', updatedAt: 'modifiedTime' },
    versionKey:  false,
    _id:         false,   // we manage _id manually (ISO code)
  }
);

geoCountrySchema.index({ name: 1 });
geoCountrySchema.index({ isActive: 1, isDeleted: 1 });

module.exports = mongoose.model('GeoCountry', geoCountrySchema);
