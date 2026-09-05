import mongoose from 'mongoose';
import { baseSchemaOptions } from '../../models/base.model.js';

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    cause: {
      type: String,
      default: '',
      maxlength: 500,
    },
    day: {
      type: Date,
      default: null,
    },
    date: {
      type: Date,
      default: null,
    },
    thumbnail: {
      type: String,
      default: '',
    },
    thumbnailId: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    authorAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
  },
  baseSchemaOptions
);

noticeSchema.index({ status: 1, publishedAt: -1 });
noticeSchema.index({ slug: 1 });

noticeSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  next();
});

export const Notice = mongoose.model('Notice', noticeSchema);
