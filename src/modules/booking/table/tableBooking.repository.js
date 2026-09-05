import { TableBooking } from "./tableBooking.model.js";

export const tableBookingRepository = {
  findById: (bookingId) => TableBooking.findById(bookingId),

  findByBookingNumber: (bookingNumber) =>
    TableBooking.findOne({ bookingNumber }),

  findByUserId: (userId, options = {}) => {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    return Promise.all([
      TableBooking.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      TableBooking.countDocuments({ userId }),
    ]);
  },

  findAll: (filter = {}, options = {}) => {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    return Promise.all([
      TableBooking.find(filter)
        .populate("userId", "name email phone")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      TableBooking.countDocuments(filter),
    ]);
  },

  create: (data) => TableBooking.create(data),

  updateById: (bookingId, updateData) =>
    TableBooking.findByIdAndUpdate(bookingId, updateData, { new: true }),

  updateStatus: (
    bookingId,
    status,
    adminId = null,
    note = "",
    tableNumber = "",
  ) => {
    const updateData = {
      $set: { status },
      $push: {
        statusHistory: {
          status,
          at: new Date(),
          byAdminId: adminId,
          note,
        },
      },
    };

    if (tableNumber) {
      updateData.$set.tableNumber = tableNumber;
    }

    return TableBooking.findByIdAndUpdate(bookingId, updateData, {
      new: true,
    });
  },

  findConflict: (date, time, excludeId = null) => {
    const query = {
      date: new Date(date),
      time,
      status: { $in: ["pending", "confirmed", "seated"] },
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    return TableBooking.findOne(query);
  },
};
