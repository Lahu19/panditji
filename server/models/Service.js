'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

/* Requirement field schema — drives the dynamic question UI */
const reqFieldSchema = new Schema(
  {
    key:         { type: String, required: true },
    label:       { type: String, required: true },
    type:        { type: String, enum: ['TEXT','DATE','TIME','NUMBER','SELECT','MULTI_SELECT','BOOLEAN','TEXTAREA'], required: true },
    required:    { type: Boolean, default: false },
    options:     [{ type: String }],
    placeholder: { type: String },
    icon:        { type: String },
  },
  { _id: false }
);

const serviceSchema = new Schema(
  {
    categoryId:   { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    name:         { type: String, trim: true, required: true },
    description:  { type: String, trim: true },
    slug:         { type: String, trim: true, lowercase: true },

    serviceType:  {
      type: String,
      enum: ['HOME_PUJA', 'WEDDING', 'FAMILY', 'FESTIVAL', 'HAVAN_YAGNA', 'CORPORATE', 'CUSTOM'],
      default: 'HOME_PUJA',
    },

    duration: {
      min: { type: Number },          // minutes
      max: { type: Number },
      label: { type: String },        // e.g. "2–3 hrs"
    },

    pricing: {
      model: {
        type: String,
        enum: ['FIXED','STARTING_FROM','HOURLY','PER_PERSON','CUSTOM_QUOTE'],
        default: 'STARTING_FROM',
      },
      startingFrom: { type: Number },
      currency:     { type: String, default: 'INR' },
    },

    /* Configurable requirement fields — drives question flow in UI */
    requirementFields: [reqFieldSchema],

    isBookable:     { type: Boolean, default: true },
    isRequestBased: { type: Boolean, default: false },
    isActive:       { type: Boolean, default: true },
    isDeleted:      { type: Boolean, default: false },
    version:        { type: Number,  default: 1 },
    createdBy:      { type: Schema.Types.ObjectId, ref: 'User' },
    modifiedBy:     { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: { createdAt: 'createdTime', updatedAt: 'modifiedTime' },
    versionKey: false,
  }
);

serviceSchema.index({ categoryId: 1 });
serviceSchema.index({ slug: 1 }, { unique: true, sparse: true });
serviceSchema.index({ isActive: 1, isDeleted: 1 });

serviceSchema.pre(/^find/, function () {
  if (this.getFilter().isDeleted === undefined) this.where({ isDeleted: false });
});

module.exports = mongoose.model('Service', serviceSchema);
