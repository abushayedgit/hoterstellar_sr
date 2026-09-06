import { Review } from "./review.model.js";
import { Food } from "../food/food.model.js";
import { Order } from "../order/order.model.js";
import { TableBooking } from "../booking/table/tableBooking.model.js";
import { EventBooking } from "../booking/event/eventBooking.model.js";
import { reviewRepository } from "./review.repository.js";
import { NotFoundError } from "../../errors/NotFoundError.js";
import { BadRequestError } from "../../errors/BadRequestError.js";
import { ConflictError } from "../../errors/ConflictError.js";
import { logger } from "../../utils/logger.js";

import { emitAdminEvent } from "../../utils/socketEmitter.js";
import { SOCKET_EVENTS } from "../../constants/socketEvents.js";

const updateFoodRating = async (foodId) => {
  const result = await reviewRepository.getAverageRatingForFood(foodId);

  const avgRating =
    result.length > 0 ? Math.round(result[0].avgRating * 10) / 10 : 0;
  const totalRatings = result.length > 0 ? result[0].totalRatings : 0;

  await Food.findByIdAndUpdate(foodId, {
    rating: avgRating,
    totalRatings,
  });
};

export const createFoodReview = async (userId, reviewData) => {
  const { orderId, foodId, rating, title, comment, category } = reviewData;

  // Verify order exists and belongs to user
  const order = await Order.findById(orderId);
  if (!order) {
    throw new NotFoundError("Order not found");
  }

  if (order.userId.toString() !== userId.toString()) {
    throw new BadRequestError("You can only review your own orders");
  }

  if (order.status !== "completed") {
    throw new BadRequestError("You can only review completed orders");
  }

  // Verify food is in order
  const foodInOrder = order.items.some(
    (item) => item.food.toString() === foodId,
  );
  if (!foodInOrder) {
    throw new BadRequestError("This food is not in your order");
  }

  // Check if already reviewed this food
  const existingReview = await reviewRepository.findByUserAndFood(
    userId,
    foodId,
  );
  if (existingReview) {
    throw new ConflictError("You have already reviewed this food");
  }

  const review = await reviewRepository.create({
    userId,
    type: "food",
    food: foodId,
    orderId,
    rating,
    title,
    comment,
    category,
    isApproved: true,
  });

  await updateFoodRating(foodId);

  logger.info("Food review created", { reviewId: review._id, userId, foodId });

  emitAdminEvent(SOCKET_EVENTS.REVIEW_NEW, {
    reviewId: review._id,
    type: "food",
    foodId,
    rating,
  });

  return review;
};

export const createTableReview = async (userId, reviewData) => {
  const { tableBookingId, rating, title, comment, category } = reviewData;

  // If tableBookingId is provided, verify it belongs to the user and is completed
  if (tableBookingId) {
    const booking = await TableBooking.findById(tableBookingId);
    if (!booking) {
      throw new NotFoundError("Table booking not found");
    }

    if (booking.userId && booking.userId.toString() !== userId.toString()) {
      throw new BadRequestError("You can only review your own bookings");
    }

    if (booking.status !== "completed") {
      throw new BadRequestError("You can only review completed bookings");
    }

    // Check if already reviewed this specific booking (unique index will also enforce)
    const existingReview = await reviewRepository.findByUserAndTableBooking(
      userId,
      tableBookingId,
    );
    if (existingReview) {
      throw new ConflictError("You have already reviewed this booking");
    }
  }

  const review = await reviewRepository.create({
    userId,
    type: "table",
    tableBooking: tableBookingId || null, // set null if not provided
    rating,
    title,
    comment,
    category,
    isApproved: true,
  });

  logger.info("Table review created", {
    reviewId: review._id,
    userId,
    tableBookingId: tableBookingId || null,
  });

  emitAdminEvent(SOCKET_EVENTS.REVIEW_NEW, {
    reviewId: review._id,
    type: "table",
    tableBookingId: tableBookingId || null,
    rating,
  });

  return review;
};

export const createEventReview = async (userId, reviewData) => {
  const { eventBookingId, rating, title, comment, category } = reviewData;

  // If eventBookingId is provided, verify it belongs to the user and is completed
  if (eventBookingId) {
    const booking = await EventBooking.findById(eventBookingId);
    if (!booking) {
      throw new NotFoundError("Event booking not found");
    }

    if (booking.userId && booking.userId.toString() !== userId.toString()) {
      throw new BadRequestError("You can only review your own bookings");
    }

    if (booking.status !== "completed") {
      throw new BadRequestError("You can only review completed bookings");
    }

    // Check if already reviewed this specific booking
    const existingReview = await reviewRepository.findByUserAndEventBooking(
      userId,
      eventBookingId,
    );
    if (existingReview) {
      throw new ConflictError("You have already reviewed this booking");
    }
  }

  const review = await reviewRepository.create({
    userId,
    type: "event",
    eventBooking: eventBookingId || null,
    rating,
    title,
    comment,
    category,
    isApproved: true,
  });

  logger.info("Event review created", {
    reviewId: review._id,
    userId,
    eventBookingId: eventBookingId || null,
  });
  emitAdminEvent(SOCKET_EVENTS.REVIEW_NEW, {
    reviewId: review._id,
    type: "event",
    eventBookingId: eventBookingId || null,
    rating,
  });
  return review;
};

export const getUserReviews = async (userId, query) => {
  const { page = 1, limit = 10 } = query;

  const filter = { userId };
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate("food", "name images")
      .populate("tableBooking", "bookingNumber")
      .populate("eventBooking", "bookingNumber")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: reviews,
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

export const listReviews = async (query) => {
  const {
    page = 1,
    limit = 10,
    type,
    isApproved,
    rating,
    foodId,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const filter = {};

  if (type) filter.type = type;
  if (isApproved !== undefined) {
    filter.isApproved = isApproved === "true";
  }
  if (rating) filter.rating = rating;
  if (foodId) filter.food = foodId;

  const sort = {
    [sortBy]: sortOrder === "desc" ? -1 : 1,
  };

  const [reviews, total] = await reviewRepository.findAll(filter, {
    page,
    limit,
    sort,
  });

  const totalPages = Math.ceil(total / limit);

  return {
    data: reviews,
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

export const getPublicReviewsForFood = async (foodId, query) => {
  const { page = 1, limit = 10 } = query;

  const filter = {
    food: foodId,
    type: "food",
    isApproved: true,
  };

  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate("userId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: reviews,
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

export const updateReview = async (reviewId, userId, updateData) => {
  const review = await reviewRepository.findById(reviewId);

  if (!review) {
    throw new NotFoundError("Review not found");
  }

  if (review.userId.toString() !== userId.toString()) {
    throw new BadRequestError("You can only update your own reviews");
  }

  const updatedReview = await reviewRepository.updateById(reviewId, updateData);

  if (review.type === "food" && review.food) {
    await updateFoodRating(review.food);
  }

  logger.info("Review updated", { reviewId, userId });

  return updatedReview;
};

export const deleteReview = async (reviewId, userId) => {
  const review = await reviewRepository.findById(reviewId);

  if (!review) {
    throw new NotFoundError("Review not found");
  }

  if (review.userId.toString() !== userId.toString()) {
    throw new BadRequestError("You can only delete your own reviews");
  }

  await reviewRepository.deleteById(reviewId);

  if (review.type === "food" && review.food) {
    await updateFoodRating(review.food);
  }

  logger.info("Review deleted", { reviewId, userId });

  return true;
};

export const moderateReview = async (reviewId, moderationData, adminId) => {
  const review = await reviewRepository.findById(reviewId);

  if (!review) {
    throw new NotFoundError("Review not found");
  }

  review.isApproved = moderationData.isApproved;
  await review.save();

  if (review.type === "food" && review.food) {
    await updateFoodRating(review.food);
  }

  logger.info("Review moderated", {
    reviewId,
    adminId,
    isApproved: moderationData.isApproved,
  });

  return review;
};

export const respondToReview = async (reviewId, response, adminId) => {
  const review = await reviewRepository.findById(reviewId);

  if (!review) {
    throw new NotFoundError("Review not found");
  }

  review.adminResponse = {
    response,
    respondedBy: adminId,
    respondedAt: new Date(),
  };

  await review.save();

  logger.info("Review responded", { reviewId, adminId });

  return review;
};

export const markReviewHelpful = async (reviewId) => {
  const review = await reviewRepository.findById(reviewId);

  if (!review) {
    throw new NotFoundError("Review not found");
  }

  review.helpfulVotes += 1;
  await review.save();

  return review;
};

export const getEligibleOrdersForReview = async (userId) => {
  const orders = await Order.find({
    userId,
    status: "completed",
  }).select("_id orderNumber items createdAt");

  const reviewedFoods = await Review.find({
    userId,
    type: "food",
  }).select("food");

  const reviewedFoodIds = new Set(reviewedFoods.map((r) => r.food.toString()));

  const eligibleOrders = [];

  for (const order of orders) {
    const unreviewedItems = order.items.filter(
      (item) => !reviewedFoodIds.has(item.food.toString()),
    );

    if (unreviewedItems.length > 0) {
      eligibleOrders.push({
        orderId: order._id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        unreviewedItems: unreviewedItems.map((item) => ({
          foodId: item.food,
          name: item.name,
        })),
      });
    }
  }

  return eligibleOrders;
};
