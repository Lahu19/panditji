'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const memberSchema = new Schema(
  {
    userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role:      { type: String, enum: ['OWNER', 'ADMIN', 'MEMBER'], default: 'MEMBER' },
    joinedAt:  { type: Date, default: Date.now },
    isActive:  { type: Boolean, default: true },
  },
  { _id: false }
);

const organizationSchema = new Schema(
  {
    name:          { type: String, trim: true, required: true },
    displayName:   { type: String, trim: true },
    description:   { type: String, trim: true },
    orgType:       {
      type: String,
      enum: ['CORPORATE', 'EVENT_ORGANIZER', 'WEDDING_PLANNER', 'TEMPLE', 'NGO', 'OTHER'],
      default: 'CORPORATE',
    },

    contact: {
      phone:   { type: String, trim: true },
      email:   { type: String, trim: true, lowercase: true },
      website: { type: String, trim: true },
    },

    address: {
      addressLine1: { type: String },
      city:         { type: String },
      state:        { type: String },
      country:      { type: String, default: 'IN' },
      postalCode:   { type: String },
    },

    members: [memberSchema],

    /* Billing / invoicing settings */
    billing: {
      gstNumber:    { type: String, trim: true },
      pan:          { type: String, trim: true },
      currency:     { type: String, default: 'INR' },
    },

    /* Approval workflow — only ADMIN-approved members can book */
    requiresApproval: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
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

organizationSchema.index({ 'members.userId': 1 });
organizationSchema.index({ orgType: 1, status: 1 });
organizationSchema.index({ isDeleted: 1, status: 1 });

organizationSchema.pre(/^find/, function () {
  if (this.getFilter().isDeleted === undefined) this.where({ isDeleted: false });
});

module.exports = mongoose.model('Organization', organizationSchema);
