import {
  createOrder,
  getOrderById,
  getUserOrders,
  listOrders,
  updateOrderStatus,
  cancelOrder,
} from "./order.service.js";

export const createOrderController = async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const orderData = req.body;

    const order = await createOrder(userId, orderData);

    return res.status(201).json({
      success: true,
      statusCode: 201,
      code: "CREATED",
      message: "Order created successfully",
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.auth.userId;

    const order = await getOrderById(id, userId);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Order retrieved",
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserOrdersController = async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const result = await getUserOrders(userId, req.query);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Orders retrieved",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const listOrdersController = async (req, res, next) => {
  try {
    const result = await listOrders(req.query);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Orders retrieved",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatusController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const adminId = req.auth.adminId;

    const order = await updateOrderStatus(id, status, adminId, note);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Order status updated",
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

export const cancelOrderController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.auth.userId || null;
    const adminId = req.auth.adminId || null;

    const order = await cancelOrder(id, userId, reason);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Order cancelled",
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};
