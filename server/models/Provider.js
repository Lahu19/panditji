'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

/* ── Embedded sub-schemas ── */
const ratingSchema = new Schema({
  overall:         { type: Number, default: 0 },
  punctuality:     { type: Number, default: 0 },
  communication:   { type: Number, default: 0 },
  serviceQuality:  { type: Number, default: 0 },
  professionalism: { type: Number, default: 0 },
  count:           { type: Number, default: 0 },
}, { _id: false });

const bookingSummarySchema = new Schema({
  total:           { type: Number, default: 0 },
  completed:       { type: Number, default: 0 },
  cancelled:       { type: Number, default: 0 },
  repeatCustomers: { type: Number, default: 0 },
}, { _id: false });

const mediaSchema = new Schema({
  mediaType:          { type: String, enum: ['VIDEO','PHOTO','INTRO_VIDEO','CERTIFICATE'], default: 'VIDEO' },
  title:              { type: String, trim: true },
  url:                { type: String },
  thumbnailUrl:       { type: String },
  serviceId:          { type: Schema.Types.ObjectId, ref: 'Service' },
  eventDate:          { type: Date },
  location:           { type: String },
  consentStatus:      { type: String, enum: ['PENDING','GRANTED','REVOKED'], default: 'GRANTED' },
  verificationStatus: { type: String, enum: ['UNVERIFIED','VERIFIED'], default: 'UNVERIFIED' },
});

const verificationSchema = new Schema({
  type:       { type: String, enum: ['IDENTITY','PHONE','ADDRESS','CREDENTIAL','PROFILE','BACKGROUND'] },
  status:     { type: String, enum: ['PENDING','VERIFIED','FAILED'], default: 'PENDING' },
  verifiedAt: { type: Date },
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  expiryTime: { type: Date },
  remarks:    { type: String },
});

const qnaSchema = new Schema({
  question: { type: String, trim: true },
  answer:   { type: String, trim: true },
  isPublic: { type: Boolean, default: true },
}, { _id: false });

const eventBreakdownSchema = new Schema({
  serviceId: { type: Schema.Types.ObjectId, ref: 'Service' },
  label:     { type: String },
  count:     { type: Number, default: 0 },
  icon:      { type: String },
}, { _id: false });

/* ── Main schema ── */
const providerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    providerType: {
      type: String,
      enum: ['INDIVIDUAL', 'TEAM', 'ORGANIZATION', 'TEMPLE', 'SERVICE_GROUP'],
      default: 'INDIVIDUAL',
    },

    displayName: { type: String, trim: true, required: true },

    profile: {
      about:           { type: String, trim: true },
      experienceYears: { type: Number, default: 0 },
      languages:       [{ type: String }],
      traditions:      [{ type: String }],
    },

    /* Service IDs this provider supports — flat list for quick matching */
    serviceIds: [{ type: Schema.Types.ObjectId, ref: 'Service' }],

    /* Service areas — array of strings (city names) for MVP */
    serviceAreas: [{ type: String, trim: true }],

    /* Location for geo queries */
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
      city:    { type: String },
      state:   { type: String },
      country: { type: String, default: 'IN' },
    },

    pricing: {
      startingFrom: { type: Number },
      currency:     { type: String, default: 'INR' },
      breakdown: {
        pandit:   { type: Number, default: 0 },
        samagri:  { type: Number, default: 0 },
        travel:   { type: Number, default: 0 },
        platform: { type: Number, default: 100 },
      },
      priceRange: {
        min: { type: Number },
        max: { type: Number },
      },
    },

    capabilities: {
      samagriAvailable:          { type: Boolean, default: false },
      supportsMultiplePandits:   { type: Boolean, default: false },
      acceptsCorporateBookings:  { type: Boolean, default: false },
      acceptsNriBookings:        { type: Boolean, default: false },
    },

    ratingSummary:  { type: ratingSchema,         default: () => ({}) },
    bookingSummary: { type: bookingSummarySchema,  default: () => ({}) },
    eventBreakdown: [eventBreakdownSchema],

    media:         [mediaSchema],
    verifications: [verificationSchema],
    qa:            [qnaSchema],

    badges: [{ type: String }],

    availability: {
      type: Map,
      of: { type: String, enum: ['available', 'limited', 'booked'] },
    },

    verificationStatus: {
      type: String,
      enum: ['UNVERIFIED', 'PARTIAL', 'VERIFIED'],
      default: 'UNVERIFIED',
    },

    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'],
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

/* ── Indexes ── */
providerSchema.index({ location: '2dsphere' });
providerSchema.index({ serviceIds: 1 });
providerSchema.index({ 'profile.languages': 1 });
providerSchema.index({ status: 1, isDeleted: 1 });
providerSchema.index({ 'ratingSummary.overall': -1 });
providerSchema.index({ userId: 1 }, { unique: true });

providerSchema.pre(/^find/, function () {
  if (this.getFilter().isDeleted === undefined) this.where({ isDeleted: false });
});

module.exports = mongoose.model('Provider', providerSchema);
