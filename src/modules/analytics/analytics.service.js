import { Order } from "../order/order.model.js";
import { Food } from "../food/food.model.js";
import { TableBooking } from "../booking/table/tableBooking.model.js";
import { EventBooking } from "../booking/event/eventBooking.model.js";
import { Review } from "../review/review.model.js";
import { Visitor } from "../visitor/visitor.model.js";
import { PageTracking } from "../visitor/pageTracking.model.js";
import { AnalyticsDeletionConfirmation } from "./analytics.model.js";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import { hashToken, generateOTP } from "../../utils/token.utils.js";
import { getBrevoClient } from "../../config/brevo.js";
import { BadRequestError } from "../../errors/BadRequestError.js";

const getDateRange = (period, year, month, day) => {
  const now = new Date();
  const targetYear = year || now.getFullYear();
  const targetMonth = month || now.getMonth() + 1;
  const targetDay = day || now.getDate();

  let startDate, endDate;

  switch (period) {
    case "daily":
      startDate = new Date(targetYear, targetMonth - 1, targetDay);
      endDate = new Date(targetYear, targetMonth - 1, targetDay + 1);
      break;
    case "weekly": {
      const currentDay = targetDay || now.getDate();
      const currentDate = new Date(targetYear, targetMonth - 1, currentDay);
      const dayOfWeek = currentDate.getDay();
      const diff =
        currentDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      startDate = new Date(targetYear, targetMonth - 1, diff);
      endDate = new Date(targetYear, targetMonth - 1, diff + 7);
      break;
    }
    case "monthly":
      startDate = new Date(targetYear, targetMonth - 1, 1);
      endDate = new Date(targetYear, targetMonth, 1);
      break;
    case "yearly":
      startDate = new Date(targetYear, 0, 1);
      endDate = new Date(targetYear + 1, 0, 1);
      break;
    case "halfYearly": {
      const half = Math.ceil(targetMonth / 6);
      startDate = new Date(targetYear, (half - 1) * 6, 1);
      endDate = new Date(targetYear, half * 6, 1);
      break;
    }
    default:
      startDate = new Date(targetYear, targetMonth - 1, targetDay);
      endDate = new Date(targetYear, targetMonth - 1, targetDay + 1);
  }

  return { startDate, endDate };
};

export const getOrderAnalytics = async (query) => {
  const { period, year, month, day } = query;
  const { startDate, endDate } = getDateRange(period, year, month, day);

  const [orderStats, statusBreakdown, typeBreakdown, dailyOrders] =
    await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: "$totalAmount" },
            averageOrderValue: { $avg: "$totalAmount" },
            maxOrderValue: { $max: "$totalAmount" },
            minOrderValue: { $min: "$totalAmount" },
          },
        },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
        { $group: { _id: "$orderType", count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: env.BUSINESS_TIMEZONE,
              },
            },
            orders: { $sum: 1 },
            revenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

  const data = {
    summary: orderStats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      maxOrderValue: 0,
      minOrderValue: 0,
    },
    statusBreakdown,
    typeBreakdown,
    dailyOrders,
  };

  return data;
};

export const getFoodAnalytics = async (query) => {
  const { period, year, month, day } = query;
  const { startDate, endDate } = getDateRange(period, year, month, day);

  const [topFoods, categoryBreakdown, foodRatings] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.food",
          name: { $first: "$items.name" },
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.lineTotal" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
    ]),
    Food.aggregate([
      {
        $group: {
          _id: "$category",
          totalFoods: { $sum: 1 },
          averagePrice: { $avg: "$price" },
          availableFoods: { $sum: { $cond: ["$isAvailable", 1, 0] } },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $project: {
          _id: 1,
          categoryName: "$category.name",
          totalFoods: 1,
          averagePrice: 1,
          availableFoods: 1,
        },
      },
    ]),
    Review.aggregate([
      { $match: { type: "food", isApproved: true } },
      {
        $group: {
          _id: "$food",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
      { $sort: { averageRating: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "foods",
          localField: "_id",
          foreignField: "_id",
          as: "food",
        },
      },
      { $unwind: "$food" },
      {
        $project: {
          _id: 1,
          foodName: "$food.name",
          averageRating: 1,
          totalReviews: 1,
        },
      },
    ]),
  ]);

  const data = {
    topFoods,
    categoryBreakdown,
    foodRatings,
  };

  return data;
};

export const getBookingAnalytics = async (query) => {
  const { period, year, month, day } = query;
  const { startDate, endDate } = getDateRange(period, year, month, day);

  const [tableStats, eventStats] = await Promise.all([
    TableBooking.aggregate([
      { $match: { date: { $gte: startDate, $lt: endDate } } },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          confirmedBookings: {
            $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] },
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
          averageGuests: { $avg: "$guestCount" },
        },
      },
    ]),
    EventBooking.aggregate([
      { $match: { eventDate: { $gte: startDate, $lt: endDate } } },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          confirmedBookings: {
            $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] },
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
          averageGuests: { $avg: "$guestCount" },
        },
      },
    ]),
  ]);

  const data = {
    tableBookings: tableStats[0] || {
      totalBookings: 0,
      confirmedBookings: 0,
      cancelledBookings: 0,
      averageGuests: 0,
    },
    eventBookings: eventStats[0] || {
      totalBookings: 0,
      confirmedBookings: 0,
      cancelledBookings: 0,
      averageGuests: 0,
    },
  };

  return data;
};

export const getReviewAnalytics = async (query) => {
  const { period, year, month, day } = query;
  const { startDate, endDate } = getDateRange(period, year, month, day);

  const [ratingBreakdown, typeBreakdown, totalReviews] = await Promise.all([
    Review.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate },
          isApproved: true,
        },
      },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]),
    Review.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate },
          isApproved: true,
        },
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          averageRating: { $avg: "$rating" },
        },
      },
    ]),
    Review.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate },
      isApproved: true,
    }),
  ]);

  const data = {
    totalReviews,
    ratingBreakdown,
    typeBreakdown,
  };

  return data;
};

export const getIncomeAnalytics = async (query) => {
  const { period, year, month, day } = query;
  const { startDate, endDate } = getDateRange(period, year, month, day);

  const [orderIncome, bookingIncome] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate },
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: env.BUSINESS_TIMEZONE,
            },
          },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    EventBooking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate },
          status: { $in: ["confirmed", "deposit_paid", "completed"] },
        },
      },
      {
        $group: {
          _id: null,
          totalQuotation: { $sum: { $ifNull: ["$quotationAmount", 0] } },
          totalDeposit: { $sum: { $ifNull: ["$depositAmount", 0] } },
        },
      },
    ]),
  ]);

  const totalOrderRevenue = orderIncome.reduce(
    (sum, item) => sum + item.revenue,
    0,
  );
  const totalBookingQuotation = bookingIncome[0]?.totalQuotation || 0;
  const totalBookingDeposit = bookingIncome[0]?.totalDeposit || 0;

  const data = {
    totalOrderRevenue,
    totalBookingQuotation,
    totalBookingDeposit,
    totalIncome: totalOrderRevenue + totalBookingDeposit,
    dailyIncome: orderIncome,
  };

  return data;
};

export const requestAnalyticsDeletion = async (adminId, email) => {
  const code = generateOTP();
  const codeHash = hashToken(code);

  await AnalyticsDeletionConfirmation.create({
    adminId,
    codeHash,
    passwordVerifiedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
  });

  // Send email
  const brevoClient = getBrevoClient();
  if (brevoClient) {
    await brevoClient.sendEmail({
      to: email,
      subject: "Analytics Deletion Confirmation - Hoterstellar",
      html: `
        <h2>Analytics Deletion Confirmation</h2>
        <p>Your confirmation code is:</p>
        <h1 style="font-size: 32px; letter-spacing: 5px;">${code}</h1>
        <p>This code will expire in 30 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });
  }

  logger.info("Analytics deletion requested", { adminId });

  return true;
};

export const deleteAnalytics = async (adminId, code) => {
  const confirmation = await AnalyticsDeletionConfirmation.findOne({
    adminId,
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  }).select("+codeHash");

  if (!confirmation) {
    throw new BadRequestError("No active deletion confirmation found");
  }

  if (confirmation.attempts >= 5) {
    throw new BadRequestError("Too many attempts. Please request a new code.");
  }

  const codeHash = hashToken(code);
  if (codeHash !== confirmation.codeHash) {
    confirmation.attempts += 1;
    await confirmation.save();
    throw new BadRequestError("Invalid confirmation code");
  }

  confirmation.consumedAt = new Date();
  await confirmation.save();

  // Delete analytics data
  await Promise.all([Visitor.deleteMany({}), PageTracking.deleteMany({})]);

  logger.info("Analytics deleted", { adminId });

  return true;
};
