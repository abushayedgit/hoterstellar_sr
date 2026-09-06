import { Order } from "./order.model.js";
import { Cart } from "../cart/cart.model.js";
import { Food } from "../food/food.model.js";
import { Counter } from "../../models/counter.model.js";
import { orderRepository } from "./order.repository.js";
import { NotFoundError } from "../../errors/NotFoundError.js";
import { BadRequestError } from "../../errors/BadRequestError.js";
import { ConflictError } from "../../errors/ConflictError.js";
import { logger } from "../../utils/logger.js";
import { getBrevoClient } from "../../config/brevo.js";
import { emitAdminEvent } from "../../utils/socketEmitter.js";
import { SOCKET_EVENTS } from "../../constants/socketEvents.js";

const VALID_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["out_for_delivery", "delivered", "completed", "cancelled"],
  out_for_delivery: ["delivered", "completed"],
  delivered: ["completed"],
  completed: [],
  cancelled: [],
};

const TAX_RATE = 0.05; // 5% tax

const generateOrderNumber = async () => {
  const seq = await Counter.findOneAndUpdate(
    { key: "orderNumber" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );

  const year = new Date().getFullYear();
  const paddedSeq = String(seq.seq).padStart(6, "0");
  return `ORD-${year}-${paddedSeq}`;
};

const sendOrderConfirmationEmail = async (order) => {
  const brevoClient = getBrevoClient();
  if (!brevoClient || !order.email) {
    return;
  }

  try {
    await brevoClient.sendEmail({
      to: order.email,
      subject: `Order Confirmation - ${order.orderNumber}`,
      html: `
        <h2>Thank you for your order!</h2>
        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p><strong>Total Amount:</strong> ৳${order.totalAmount}</p>
        <h3>Items:</h3>
        <ul>
          ${order.items.map((item) => `<li>${item.name} x ${item.quantity} = ৳${item.lineTotal}</li>`).join("")}
        </ul>
        <p>We will notify you when your order is ready.</p>
      `,
    });
  } catch (error) {
    logger.error("Failed to send order confirmation email", {
      error: error.message,
    });
  }
};

export const createOrder = async (userId, orderData) => {
  // Get cart
  const cart = await Cart.findOne({ userId });

  if (!cart || cart.items.length === 0) {
    throw new BadRequestError("Cart is empty");
  }

  // Verify all foods are still available and get current prices
  const foodIds = cart.items.map((item) => item.food);
  const foods = await Food.find({ _id: { $in: foodIds } });

  const foodMap = new Map(foods.map((food) => [food._id.toString(), food]));

  const orderItems = [];
  let subtotal = 0;
  let discountTotal = 0;

  for (const cartItem of cart.items) {
    const food = foodMap.get(cartItem.food.toString());

    if (!food) {
      throw new BadRequestError(`Food item no longer exists: ${cartItem.name}`);
    }

    if (!food.isAvailable) {
      throw new BadRequestError(`Food is not available: ${food.name}`);
    }

    const unitPrice = food.price;
    const discount = food.discount || 0;
    const quantity = cartItem.quantity;
    const lineTotal = unitPrice * quantity;
    const itemDiscount = (lineTotal * discount) / 100;

    orderItems.push({
      food: food._id,
      name: food.name,
      unitPrice,
      discount,
      quantity,
      lineTotal,
      specialInstructions: cartItem.specialInstructions || "",
    });

    subtotal += lineTotal;
    discountTotal += itemDiscount;
  }

  const taxTotal = (subtotal - discountTotal) * TAX_RATE;
  const totalAmount = subtotal - discountTotal + taxTotal;

  // Generate order number
  const orderNumber = await generateOrderNumber();

  const order = await orderRepository.create({
    orderNumber,
    userId,
    items: orderItems,
    subtotal,
    discountTotal,
    taxTotal,
    totalAmount,
    customerName: orderData.customerName,
    phone: orderData.phone,
    email: orderData.email || "",
    address: orderData.address || null,
    orderType: orderData.orderType,
    paymentMethod: orderData.paymentMethod,
    specialInstructions: orderData.specialInstructions || "",
    status: "pending",
    statusHistory: [
      {
        status: "pending",
        at: new Date(),
      },
    ],
  });

  // Clear cart
  cart.items = [];
  cart.recalculateTotals();
  await cart.save();

  // Send confirmation email
  await sendOrderConfirmationEmail(order);

  logger.info("Order created", { orderId: order._id, orderNumber, userId });

  emitAdminEvent(SOCKET_EVENTS.ORDER_NEW, {
    orderId: order._id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    totalAmount: order.totalAmount,
    orderType: order.orderType,
    status: order.status,
  });

  return order;
};

export const getOrderById = async (orderId, userId = null) => {
  const order = await orderRepository
    .findById(orderId)
    .populate("userId", "name email phone");

  if (!order) {
    throw new NotFoundError("Order not found");
  }

  // Check ownership if userId provided
  if (userId && order.userId._id.toString() !== userId.toString()) {
    throw new NotFoundError("Order not found");
  }

  return order;
};

export const getUserOrders = async (userId, query) => {
  const { page = 1, limit = 10 } = query;

  const [orders, total] = await orderRepository.findByUserId(userId, {
    page,
    limit,
  });

  const totalPages = Math.ceil(total / limit);

  return {
    data: orders,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

export const listOrders = async (query) => {
  const {
    page = 1,
    limit = 10,
    status,
    orderType,
    paymentStatus,
    search,
    dateFrom,
    dateTo,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const filter = {};

  if (status) filter.status = status;
  if (orderType) filter.orderType = orderType;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  if (search) {
    filter.$or = [
      { orderNumber: { $regex: search, $options: "i" } },
      { customerName: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const [orders, total] = await orderRepository.findAll(filter, {
    page,
    limit,
    sort,
  });

  const totalPages = Math.ceil(total / limit);

  return {
    data: orders,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

export const updateOrderStatus = async (
  orderId,
  newStatus,
  adminId,
  note = "",
) => {
  const order = await orderRepository.findById(orderId);

  if (!order) {
    throw new NotFoundError("Order not found");
  }

  if (order.status === "cancelled" || order.status === "completed") {
    throw new ConflictError(`Order is already ${order.status}`);
  }

  const allowedTransitions = VALID_TRANSITIONS[order.status] || [];

  if (!allowedTransitions.includes(newStatus)) {
    throw new ConflictError(
      `Cannot transition from ${order.status} to ${newStatus}`,
    );
  }

  const updatedOrder = await orderRepository.updateStatus(
    orderId,
    newStatus,
    adminId,
    note,
  );

  if (newStatus === "confirmed") {
    emitAdminEvent(SOCKET_EVENTS.ORDER_CONFIRMED, {
      orderId,
      orderNumber: order.orderNumber,
      status: newStatus,
    });
  } else if (newStatus === "cancelled") {
    emitAdminEvent(SOCKET_EVENTS.ORDER_CANCELLED, {
      orderId,
      orderNumber: order.orderNumber,
      status: newStatus,
      reason: note,
    });
  }

  logger.info("Order status updated", {
    orderId,
    from: order.status,
    to: newStatus,
    adminId,
  });

  return updatedOrder;
};

export const cancelOrder = async (orderId, userId = null, reason = "") => {
  const order = await orderRepository.findById(orderId);

  if (!order) {
    throw new NotFoundError("Order not found");
  }

  // Check ownership for user cancellation
  if (userId && order.userId.toString() !== userId.toString()) {
    throw new NotFoundError("Order not found");
  }

  if (order.status !== "pending" && order.status !== "confirmed") {
    throw new ConflictError(
      `Order cannot be cancelled from ${order.status} status`,
    );
  }

  const updatedOrder = await orderRepository.updateStatus(
    orderId,
    "cancelled",
    null,
    reason,
  );

  emitAdminEvent(SOCKET_EVENTS.ORDER_CANCELLED, {
    orderId,
    orderNumber: order.orderNumber,
    reason,
  });

  logger.info("Order cancelled", { orderId, userId, reason });

  return updatedOrder;
};
