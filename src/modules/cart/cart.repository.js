import { Cart } from "./cart.model.js";

export const cartRepository = {
  findByUserId: (userId) => Cart.findOne({ userId }),

  findById: (cartId) => Cart.findById(cartId),

  create: (data) => Cart.create(data),

  updateById: (cartId, updateData) =>
    Cart.findByIdAndUpdate(cartId, updateData, { new: true }),

  deleteById: (cartId) => Cart.findByIdAndDelete(cartId),

  deleteByUserId: (userId) => Cart.findOneAndDelete({ userId }),
};
