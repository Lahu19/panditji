'use strict';
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    userType: {
      type: String,
      enum: ['CUSTOMER', 'PROVIDER', 'ADMIN'],
      default: 'CUSTOMER',
    },

    profile: {
      firstName:   { type: String, trim: true },
      lastName:    { type: String, trim: true },
      displayName: { type: String, trim: true },
      photo:       { type: String },
    },

    contact: {
      phone: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
    },

    passwordHash: { type: String, select: false },

    preferences: {
      language: { type: String, default: 'Hindi' },
      currency: { type: String, default: 'INR' },
    },

    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
    },

    isDeleted: { type: Boolean, default: false },
    version:   { type: Number, default: 1 },

    createdBy:  { type: Schema.Types.ObjectId, ref: 'User' },
    modifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: { createdAt: 'createdTime', updatedAt: 'modifiedTime' },
    versionKey: false,
  }
);

/* ── Indexes ── */
userSchema.index({ 'contact.email': 1 }, { sparse: true });
userSchema.index({ 'contact.phone': 1 }, { sparse: true });
userSchema.index({ isDeleted: 1, status: 1 });

/* ── Password helpers ── */
userSchema.methods.setPassword = async function (plain) {
  this.passwordHash = await bcrypt.hash(plain, 12);
};

userSchema.methods.verifyPassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

/* ── Hide deleted by default ── */
userSchema.pre(/^find/, function () {
  if (this.getFilter().isDeleted === undefined) this.where({ isDeleted: false });
});

module.exports = mongoose.model('User', userSchema);
