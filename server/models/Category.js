'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const categorySchema = new Schema(
  {
    name:             { type: String, trim: true, required: true },
    description:      { type: String, trim: true },
    icon:             { type: String },
    color:            { type: String },
    slug:             { type: String, trim: true, lowercase: true },
    parentCategoryId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    displayOrder:     { type: Number, default: 0 },
    isActive:         { type: Boolean, default: true },
    isDeleted:        { type: Boolean, default: false },
    version:          { type: Number,  default: 1 },
    createdBy:        { type: Schema.Types.ObjectId, ref: 'User' },
    modifiedBy:       { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: { createdAt: 'createdTime', updatedAt: 'modifiedTime' },
    versionKey: false,
  }
);

categorySchema.index({ slug: 1 }, { unique: true, sparse: true });
categorySchema.index({ parentCategoryId: 1 });
categorySchema.index({ isActive: 1, isDeleted: 1 });

categorySchema.pre(/^find/, function () {
  if (this.getFilter().isDeleted === undefined) this.where({ isDeleted: false });
});

module.exports = mongoose.model('Category', categorySchema);
