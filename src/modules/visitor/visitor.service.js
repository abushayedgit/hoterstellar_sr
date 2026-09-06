import { Visitor } from "./visitor.model.js";
import { PageTracking } from "./pageTracking.model.js";
import { logger } from "../../utils/logger.js";
import axios from "axios";

const getGeolocation = async (ip) => {
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip === "localhost") {
    return null;
  }

  try {
    const response = await axios.get(`https://ipapi.co/${ip}/json/`, {
      timeout: 3000,
    });

    if (response.data && !response.data.error) {
      return {
        city: response.data.city || "",
        region: response.data.region || "",
        country: response.data.country_name || "",
        postalCode: response.data.postal || "",
        latitude: response.data.latitude || null,
        longitude: response.data.longitude || null,
      };
    }
  } catch (error) {
    logger.warn("Geolocation lookup failed", { ip, error: error.message });
  }

  return null;
};

const parseDeviceInfo = (userAgent) => {
  if (!userAgent) return { device: "", browser: "" };

  let device = "";
  let browser = "";

  // Browser detection
  if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Safari")) browser = "Safari";
  else if (userAgent.includes("Edge")) browser = "Edge";
  else if (userAgent.includes("Opera")) browser = "Opera";
  else browser = "Unknown";

  // Device detection
  if (userAgent.includes("iPhone")) device = "iPhone";
  else if (userAgent.includes("iPad")) device = "iPad";
  else if (userAgent.includes("Android")) device = "Android";
  else if (userAgent.includes("Windows")) device = "Windows";
  else if (userAgent.includes("Macintosh")) device = "Mac";
  else if (userAgent.includes("Linux")) device = "Linux";
  else device = "Unknown";

  return { device, browser };
};

export const trackVisitor = async (trackData, ip, userAgent) => {
  const { guestId, consentStatus } = trackData;

  const existingVisitor = await Visitor.findOne({ guestId });

  if (existingVisitor) {
    existingVisitor.consentStatus = consentStatus;
    existingVisitor.ip = ip || existingVisitor.ip;

    // Update geolocation if accepted
    if (consentStatus === "accepted" && ip) {
      const geoData = await getGeolocation(ip);
      if (geoData) {
        Object.assign(existingVisitor, geoData);
      }
    } else if (consentStatus === "declined") {
      // Remove precise geolocation
      existingVisitor.city = "";
      existingVisitor.region = "";
      existingVisitor.country = "";
      existingVisitor.postalCode = "";
      existingVisitor.latitude = null;
      existingVisitor.longitude = null;
    }

    if (userAgent) {
      const deviceInfo = parseDeviceInfo(userAgent);
      existingVisitor.device = deviceInfo.device;
      existingVisitor.browser = deviceInfo.browser;
    }

    await existingVisitor.save();
    return existingVisitor;
  }

  // New visitor
  const visitorData = {
    guestId,
    ip: ip || "",
    consentStatus,
  };

  if (userAgent) {
    const deviceInfo = parseDeviceInfo(userAgent);
    visitorData.device = deviceInfo.device;
    visitorData.browser = deviceInfo.browser;
  }

  if (consentStatus === "accepted" && ip) {
    const geoData = await getGeolocation(ip);
    if (geoData) {
      Object.assign(visitorData, geoData);
    }
  }

  const visitor = await Visitor.create(visitorData);

  logger.info("Visitor tracked", { guestId, consentStatus });

  return visitor;
};

export const trackPageView = async (trackData, userId = null) => {
  const { guestId, page, referrer, ip, userAgent } = trackData;

  const pageView = await PageTracking.create({
    guestId,
    userId,
    page,
    referrer: referrer || "",
    ip: ip || "",
    userAgent: userAgent || "",
  });

  return pageView;
};

export const listVisitors = async (query) => {
  const {
    page = 1,
    limit = 10,
    consentStatus,
    dateFrom,
    dateTo,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const filter = {};

  if (consentStatus) filter.consentStatus = consentStatus;

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };
  const skip = (page - 1) * limit;

  const [visitors, total] = await Promise.all([
    Visitor.find(filter).sort(sort).skip(skip).limit(limit),
    Visitor.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: visitors,
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

export const listPageViews = async (query) => {
  const {
    page = 1,
    limit = 10,
    page: pageFilter,
    dateFrom,
    dateTo,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const filter = {};

  if (pageFilter) filter.page = pageFilter;

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };
  const skip = (page - 1) * limit;

  const [pageViews, total] = await Promise.all([
    PageTracking.find(filter)
      .populate("userId", "name email")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    PageTracking.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: pageViews,
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

export const getVisitorStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalVisitors,
    todayVisitors,
    acceptedConsent,
    declinedConsent,
    totalPageViews,
  ] = await Promise.all([
    Visitor.countDocuments(),
    Visitor.countDocuments({ createdAt: { $gte: today } }),
    Visitor.countDocuments({ consentStatus: "accepted" }),
    Visitor.countDocuments({ consentStatus: "declined" }),
    PageTracking.countDocuments(),
  ]);

  return {
    totalVisitors,
    todayVisitors,
    acceptedConsent,
    declinedConsent,
    totalPageViews,
  };
};
