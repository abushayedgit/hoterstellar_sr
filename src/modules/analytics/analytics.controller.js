import {
  getOrderAnalytics,
  getFoodAnalytics,
  getBookingAnalytics,
  getReviewAnalytics,
  getIncomeAnalytics,
  requestAnalyticsDeletion,
  deleteAnalytics,
} from "./analytics.service.js";

export const getOrderAnalyticsController = async (req, res, next) => {
  try {
    const result = await getOrderAnalytics(req.query);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Order analytics retrieved",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getFoodAnalyticsController = async (req, res, next) => {
  try {
    const result = await getFoodAnalytics(req.query);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Food analytics retrieved",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingAnalyticsController = async (req, res, next) => {
  try {
    const result = await getBookingAnalytics(req.query);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Booking analytics retrieved",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getReviewAnalyticsController = async (req, res, next) => {
  try {
    const result = await getReviewAnalytics(req.query);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Review analytics retrieved",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getIncomeAnalyticsController = async (req, res, next) => {
  try {
    const result = await getIncomeAnalytics(req.query);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Income analytics retrieved",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const requestAnalyticsDeletionController = async (req, res, next) => {
  try {
    const adminId = req.auth.adminId;
    const adminEmail = req.auth.user?.email || "";

    await requestAnalyticsDeletion(adminId, adminEmail);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Confirmation code sent to your email",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAnalyticsController = async (req, res, next) => {
  try {
    const adminId = req.auth.adminId;
    const { code } = req.body;

    await deleteAnalytics(adminId, code);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Analytics deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
