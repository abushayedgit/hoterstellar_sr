import { Order } from "./order.model.js";

export const orderRepository = {
  findById: (orderId) => Order.findById(orderId),

  findByOrderNumber: (orderNumber) => Order.findOne({ orderNumber }),

  findByUserId: (userId, options = {}) => {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    return Promise.all([
      Order.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments({ userId }),
    ]);
  },

  findAll: (filter = {}, options = {}) => {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    return Promise.all([
      Order.find(filter)
        .populate("userId", "name email phone")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);
  },

  create: (data) => Order.create(data),

  updateById: (orderId, updateData) =>
    Order.findByIdAndUpdate(orderId, updateData, { new: true }),

  updateStatus: (orderId, status, adminId, note = "") => {
    return Order.findByIdAndUpdate(
      orderId,
      {
        $set: { status },
        $push: {
          statusHistory: {
            status,
            at: new Date(),
            byAdminId: adminId,
            note,
          },
        },
      },
      { new: true },
    );
  },
};
