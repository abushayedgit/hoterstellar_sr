import { Review } from './review.model.js';

export const reviewRepository = {
  findById: (reviewId) => Review.findById(reviewId),

  findByUserAndFood: (userId, foodId) =>
    Review.findOne({ userId, food: foodId, type: 'food' }),

  findByUserAndTableBooking: (userId, tableBookingId) =>
    Review.findOne({ userId, tableBooking: tableBookingId, type: 'table' }),

  findByUserAndEventBooking: (userId, eventBookingId) =>
    Review.findOne({ userId, eventBooking: eventBookingId, type: 'event' }),

  findAll: (filter = {}, options = {}) => {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    return Promise.all([
      Review.find(filter)
        .populate('userId', 'name email')
        .populate('food', 'name images')
        .populate('tableBooking', 'bookingNumber customerName')
        .populate('eventBooking', 'bookingNumber customerName')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Review.countDocuments(filter),
    ]);
  },

  create: (data) => Review.create(data),

  updateById: (reviewId, updateData) =>
    Review.findByIdAndUpdate(reviewId, updateData, { new: true }),

  deleteById: (reviewId) => Review.findByIdAndDelete(reviewId),

  getAverageRatingForFood: (foodId) => {
    return Review.aggregate([
      { $match: { food: foodId, type: 'food', isApproved: true } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
        },
      },
    ]);
  },
};
