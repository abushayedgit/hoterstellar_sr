import { EventBooking } from "./eventBooking.model.js";

export const eventBookingRepository = {
  findById: (bookingId) => EventBooking.findById(bookingId),

  findByBookingNumber: (bookingNumber) =>
    EventBooking.findOne({ bookingNumber }),

  findByUserId: (userId, options = {}) => {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    return Promise.all([
      EventBooking.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      EventBooking.countDocuments({ userId }),
    ]);
  },

  findAll: (filter = {}, options = {}) => {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;

    const skip = (page - 1) * limit;

    return Promise.all([
      EventBooking.find(filter)
        .populate("userId", "name email phone")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      EventBooking.countDocuments(filter),
    ]);
  },

  create: (data) => EventBooking.create(data),

  updateById: (bookingId, updateData) =>
    EventBooking.findByIdAndUpdate(bookingId, updateData, { new: true }),

  updateStatus: (
    bookingId,
    status,
    adminId = null,
    note = "",
    additionalData = {},
  ) => {
    const updateData = {
      $set: {
        status,
        ...additionalData,
      },
      $push: {
        statusHistory: {
          status,
          at: new Date(),
          byAdminId: adminId,
          note,
        },
      },
    };

    return EventBooking.findByIdAndUpdate(bookingId, updateData, { new: true });
  },
};
