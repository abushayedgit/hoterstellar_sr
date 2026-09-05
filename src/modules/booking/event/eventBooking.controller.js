import {
  createEventBooking,
  getEventBookingById,
  getUserEventBookings,
  listEventBookings,
  updateEventBooking,
  updateEventBookingStatus,
  cancelEventBooking,
} from "./eventBooking.service.js";

export const createEventBookingController = async (req, res, next) => {
  try {
    const bookingData = req.body;
    const userId = req.auth?.userId || null;

    const booking = await createEventBooking(bookingData, userId);

    return res.status(201).json({
      success: true,
      statusCode: 201,
      code: "CREATED",
      message: "Event booking created",
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

export const getEventBookingController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.auth?.userId || null;

    const booking = await getEventBookingById(id, userId);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Booking retrieved",
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserEventBookingsController = async (req, res, next) => {
  try {
    const userId = req.auth.userId;

    const result = await getUserEventBookings(userId, req.query);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Bookings retrieved",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const listEventBookingsController = async (req, res, next) => {
  try {
    const result = await listEventBookings(req.query);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Bookings retrieved",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateEventBookingController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await updateEventBooking(id, req.body);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Booking updated",
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

export const updateEventBookingStatusController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { status, note, quotationAmount, depositAmount } = req.body;

    const adminId = req.auth.adminId;

    const additionalData = {};

    if (quotationAmount !== undefined) {
      additionalData.quotationAmount = quotationAmount;
    }

    if (depositAmount !== undefined) {
      additionalData.depositAmount = depositAmount;
    }

    const booking = await updateEventBookingStatus(
      id,
      status,
      adminId,
      note,
      additionalData,
    );

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Booking status updated",
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

export const cancelEventBookingController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const userId = req.auth?.userId || null;

    const booking = await cancelEventBooking(id, userId, reason);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Booking cancelled",
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};
