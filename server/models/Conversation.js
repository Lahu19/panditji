'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

/* ── Individual message ── */
const messageSchema = new Schema(
  {
    senderId:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body:      { type: String, trim: true, maxlength: 4000 },
    mediaUrl:  { type: String },
    isRead:    { type: Boolean, default: false },
    readAt:    { type: Date },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: 'sentAt' },
    versionKey: false,
  }
);

/* ── Conversation thread ── */
const conversationSchema = new Schema(
  {
    /* Always exactly two participants: customer and provider user */
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],

    /* Optional: tie to a booking or service request */
    bookingId:  { type: Schema.Types.ObjectId, ref: 'Booking' },
    requestId:  { type: Schema.Types.ObjectId, ref: 'ServiceRequest' },

    messages: [messageSchema],

    lastMessageAt:   { type: Date },
    lastMessageBody: { type: String, maxlength: 200 },

    /* Per-participant unread counts */
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },

    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED', 'BLOCKED'],
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

conversationSchema.index({ participants: 1 });
conversationSchema.index({ bookingId: 1 }, { sparse: true });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ isDeleted: 1, status: 1 });

/* Unique conversation per participant pair (sorted to avoid duplicates) */
conversationSchema.pre('save', function () {
  if (this.isNew && this.participants.length === 2) {
    this.participants.sort((a, b) => a.toString().localeCompare(b.toString()));
  }
});

conversationSchema.pre(/^find/, function () {
  if (this.getFilter().isDeleted === undefined) this.where({ isDeleted: false });
});

module.exports = mongoose.model('Conversation', conversationSchema);
