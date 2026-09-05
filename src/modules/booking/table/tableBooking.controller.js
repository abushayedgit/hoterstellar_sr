import {
  createTableBooking,
  getTableBookingById,
  getUserTableBookings,
  listTableBookings,
  updateTableBooking,
  updateTableBookingStatus,
  cancelTableBooking,
} from "./tableBooking.service.js";

export const createTableBookingController = async (req, res, next) => {
  try {
    const bookingData = req.body;
    const userId = req.auth?.userId || null;

    const booking = await createTableBooking(bookingData, userId);

    return res.status(201).json({
      success: true,
      statusCode: 201,
      code: "CREATED",
      message: "Table booking created",
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

export const getTableBookingController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.auth?.userId || null;

    const booking = await getTableBookingById(id, userId);

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

export const getUserTableBookingsController = async (req, res, next) => {
  try {
    const userId = req.auth.userId;

    const result = await getUserTableBookings(userId, req.query);

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

export const listTableBookingsController = async (req, res, next) => {
  try {
    const result = await listTableBookings(req.query);

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

export const updateTableBookingController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await updateTableBooking(id, req.body);

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

export const updateTableBookingStatusController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note, tableNumber } = req.body;
    const adminId = req.auth.adminId;

    const booking = await updateTableBookingStatus(
      id,
      status,
      adminId,
      note,
      tableNumber,
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

export const cancelTableBookingController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const userId = req.auth?.userId || null;

    const booking = await cancelTableBooking(id, userId, reason);

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
