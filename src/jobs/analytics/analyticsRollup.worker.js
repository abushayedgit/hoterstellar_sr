import { Order } from "../../modules/order/order.model.js";
import { Visitor } from "../../modules/visitor/visitor.model.js";
import { PageTracking } from "../../modules/visitor/pageTracking.model.js";
import { deleteCache } from "../../utils/cache.js";
import { logger } from "../../utils/logger.js";

export const analyticsRollupProcessor = async (job) => {
  const { type } = job.data;

  logger.info("Processing analytics rollup", { jobId: job.id, type });

  try {
    switch (type) {
      case "daily":
        await processDailyRollup();
        break;
      case "weekly":
        await processWeeklyRollup();
        break;
      case "monthly":
        await processMonthlyRollup();
        break;
      default:
        logger.warn("Unknown rollup type", { type });
    }

    // Clear analytics caches
    await deleteCache("cache:analytics:*");

    return { success: true, type };
  } catch (error) {
    logger.error("Analytics rollup failed", {
      jobId: job.id,
      type,
      error: error.message,
    });
    throw error;
  }
};

const processDailyRollup = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [orderStats, visitorStats, pageViewStats] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: today } } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]),
    Visitor.countDocuments({ createdAt: { $gte: today } }),
    PageTracking.countDocuments({ createdAt: { $gte: today } }),
  ]);

  logger.info("Daily rollup completed", {
    orders: orderStats[0]?.totalOrders || 0,
    revenue: orderStats[0]?.totalRevenue || 0,
    visitors: visitorStats,
    pageViews: pageViewStats,
  });
};

const processWeeklyRollup = async () => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [orderStats, visitorStats] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: weekAgo } } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]),
    Visitor.countDocuments({ createdAt: { $gte: weekAgo } }),
  ]);

  logger.info("Weekly rollup completed", {
    orders: orderStats[0]?.totalOrders || 0,
    revenue: orderStats[0]?.totalRevenue || 0,
    visitors: visitorStats,
  });
};

const processMonthlyRollup = async () => {
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  const [orderStats, visitorStats] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: monthAgo } } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]),
    Visitor.countDocuments({ createdAt: { $gte: monthAgo } }),
  ]);

  logger.info("Monthly rollup completed", {
    orders: orderStats[0]?.totalOrders || 0,
    revenue: orderStats[0]?.totalRevenue || 0,
    visitors: visitorStats,
  });
};
