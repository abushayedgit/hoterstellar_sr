import { Notice } from './notice.model.js';

export const noticeRepository = {
  findById: (noticeId) => Notice.findById(noticeId),

  findBySlug: (slug) => Notice.findOne({ slug }),

  findAll: (filter = {}, options = {}) => {
    const {
      page = 1,
      limit = 10,
      sort = { publishedAt: -1 },
    } = options;

    const skip = (page - 1) * limit;

    return Promise.all([
      Notice.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Notice.countDocuments(filter),
    ]);
  },

  create: (data) => Notice.create(data),

  updateById: (noticeId, updateData) =>
    Notice.findByIdAndUpdate(
      noticeId,
      updateData,
      { new: true }
    ),

  deleteById: (noticeId) =>
    Notice.findByIdAndDelete(noticeId),
};
