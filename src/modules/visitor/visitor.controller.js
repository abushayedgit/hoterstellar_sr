import {
  trackVisitor,
  trackPageView,
  listVisitors,
  listPageViews,
  getVisitorStats,
} from "./visitor.service.js";

export const trackVisitorController = async (req, res, next) => {
  try {
    const trackData = req.body;
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
    const userAgent = req.headers["user-agent"];

    const visitor = await trackVisitor(trackData, ip, userAgent);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Visitor tracked",
      data: { visitor },
    });
  } catch (error) {
    next(error);
  }
};

export const trackPageViewController = async (req, res, next) => {
  try {
    const trackData = req.body;
    const userId = req.auth?.userId || null;
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
    const userAgent = req.headers["user-agent"];

    const pageView = await trackPageView(
      { ...trackData, ip, userAgent },
      userId,
    );

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Page view tracked",
      data: { pageView },
    });
  } catch (error) {
    next(error);
  }
};

export const listVisitorsController = async (req, res, next) => {
  try {
    const result = await listVisitors(req.query);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Visitors retrieved",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const listPageViewsController = async (req, res, next) => {
  try {
    const result = await listPageViews(req.query);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Page views retrieved",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getVisitorStatsController = async (req, res, next) => {
  try {
    const stats = await getVisitorStats();

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Visitor stats retrieved",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
