import {
  createFoodReview,
  createTableReview,
  createEventReview,
  getUserReviews,
  listReviews,
  getPublicReviewsForFood,
  updateReview,
  deleteReview,
  moderateReview,
  respondToReview,
  markReviewHelpful,
  getEligibleOrdersForReview,
} from './review.service.js';

export const createFoodReviewController = async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const reviewData = req.body;

    const review = await createFoodReview(userId, reviewData);

    return res.status(201).json({
      success: true,
      statusCode: 201,
      code: 'CREATED',
      message: 'Review created',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

export const createTableReviewController = async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const reviewData = req.body;

    const review = await createTableReview(userId, reviewData);

    return res.status(201).json({
      success: true,
      statusCode: 201,
      code: 'CREATED',
      message: 'Review created',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

export const createEventReviewController = async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const reviewData = req.body;

    const review = await createEventReview(userId, reviewData);

    return res.status(201).json({
      success: true,
      statusCode: 201,
      code: 'CREATED',
      message: 'Review created',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

export const getEligibleOrdersController = async (req, res, next) => {
  try {
    const userId = req.auth.userId;

    const eligibleOrders = await getEligibleOrdersForReview(userId);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: 'OK',
      message: 'Eligible orders retrieved',
      data: { eligibleOrders },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserReviewsController = async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const result = await getUserReviews(userId, req.query);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: 'OK',
      message: 'Reviews retrieved',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const listReviewsController = async (req, res, next) => {
  try {
    const result = await listReviews(req.query);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: 'OK',
      message: 'Reviews retrieved',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicReviewsForFoodController = async (
  req,
  res,
  next
) => {
  try {
    const { foodId } = req.params;
    const result = await getPublicReviewsForFood(foodId, req.query);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: 'OK',
      message: 'Reviews retrieved',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateReviewController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.auth.userId;
    const updateData = req.body;

    const review = await updateReview(id, userId, updateData);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: 'OK',
      message: 'Review updated',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReviewController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.auth.userId;

    await deleteReview(id, userId);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: 'OK',
      message: 'Review deleted',
    });
  } catch (error) {
    next(error);
  }
};

export const moderateReviewController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const moderationData = req.body;
    const adminId = req.auth.adminId;

    const review = await moderateReview(
      id,
      moderationData,
      adminId
    );

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: 'OK',
      message: 'Review moderated',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

export const respondToReviewController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { response } = req.body;
    const adminId = req.auth.adminId;

    const review = await respondToReview(
      id,
      response,
      adminId
    );

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: 'OK',
      message: 'Response added',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

export const markReviewHelpfulController = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    const review = await markReviewHelpful(id);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: 'OK',
      message: 'Marked as helpful',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};
