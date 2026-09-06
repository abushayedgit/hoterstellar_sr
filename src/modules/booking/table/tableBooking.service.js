import { Counter } from "../../../models/counter.model.js";
import { tableBookingRepository } from "./tableBooking.repository.js";
import { NotFoundError } from "../../../errors/NotFoundError.js";
import { BadRequestError } from "../../../errors/BadRequestError.js";
import { ConflictError } from "../../../errors/ConflictError.js";
import { logger } from "../../../utils/logger.js";
import { getBrevoClient } from "../../../config/brevo.js";
import { tableBookingConfirmationTemplate } from "../../../emails/templates/tableBookingConfirmationTemplate.js";
import { adminNewBookingNotificationTemplate } from "../../../emails/templates/adminNewBookingNotificationTemplate.js";
import { emitAdminEvent } from "../../utils/socketEmitter.js";
import { SOCKET_EVENTS } from "../../constants/socketEvents.js";

const VALID_TRANSITIONS = {
  pending: ["confirmed", "cancelled", "no_show"],
  confirmed: ["seated", "cancelled", "no_show"],
  seated: ["completed"],
  completed: [],
  cancelled: [],
  no_show: [],
};

const CANCELLATION_HOURS_LIMIT = 2;

const generateBookingNumber = async () => {
  const seq = await Counter.findOneAndUpdate(
    { key: "tableBookingNumber" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );

  const year = new Date().getFullYear();
  const paddedSeq = String(seq.seq).padStart(6, "0");

  return `TB-${year}-${paddedSeq}`;
};

const sendBookingConfirmationEmail = async (booking) => {
  const brevoClient = getBrevoClient();

  if (!brevoClient || !booking.email) {
    return;
  }

  try {
    await brevoClient.sendEmail({
      to: booking.email,
      subject: `Table Reservation Confirmed - ${booking.bookingNumber}`,
      html: tableBookingConfirmationTemplate({
        bookingNumber: booking.bookingNumber,
        customerName: booking.customerName,
        date: booking.date.toISOString().split("T")[0],
        time: booking.time,
        guestCount: booking.guestCount,
        tablePreference: booking.tablePreference,
        specialRequests: booking.specialRequests,
      }),
    });
  } catch (error) {
    logger.error("Failed to send table booking confirmation email", {
      error: error.message,
    });
  }
};

const sendAdminNotificationEmail = async (booking) => {
  const brevoClient = getBrevoClient();

  if (!brevoClient) {
    return;
  }

  try {
    const adminEmails = process.env.ADMIN_NOTIFICATION_EMAILS?.split(",") || [];

    for (const adminEmail of adminEmails) {
      if (adminEmail) {
        await brevoClient.sendEmail({
          to: adminEmail,
          subject: `New Table Reservation - ${booking.bookingNumber}`,
          html: adminNewBookingNotificationTemplate({
            bookingNumber: booking.bookingNumber,
            bookingType: "table",
            customerName: booking.customerName,
            dateTime: `${booking.date.toISOString().split("T")[0]} ${booking.time}`,
            guestCount: booking.guestCount,
          }),
        });
      }
    }
  } catch (error) {
    logger.error("Failed to send admin notification email", {
      error: error.message,
    });
  }
};

export const createTableBooking = async (bookingData, userId = null) => {
  const { date, time } = bookingData;

  const bookingDate = new Date(date);
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  if (bookingDate < today) {
    throw new BadRequestError("Booking date must be in the future");
  }

  const existingBooking = await tableBookingRepository.findConflict(date, time);

  if (existingBooking) {
    throw new ConflictError(
      "This time slot is already booked. Please choose another time.",
    );
  }

  const bookingNumber = await generateBookingNumber();

  try {
    const booking = await tableBookingRepository.create({
      ...bookingData,
      bookingNumber,
      userId,
      date: bookingDate,
      status: "pending",
      statusHistory: [
        {
          status: "pending",
          at: new Date(),
        },
      ],
    });

    await sendBookingConfirmationEmail(booking);
    await sendAdminNotificationEmail(booking);

    logger.info("Table booking created", {
      bookingId: booking._id,
      bookingNumber,
    });
    emitAdminEvent(SOCKET_EVENTS.BOOKING_TABLE_NEW, {
      bookingId: booking._id,
      bookingNumber: booking.bookingNumber,
      customerName: booking.customerName,
      date: booking.date,
      time: booking.time,
      guestCount: booking.guestCount,
    });
    return booking;
  } catch (error) {
    if (error.code === 11000) {
      throw new ConflictError(
        "This time slot is already booked. Please choose another time.",
      );
    }

    throw error;
  }
};

export const getTableBookingById = async (bookingId, userId = null) => {
  const booking = await tableBookingRepository.findById(bookingId);

  if (!booking) {
    throw new NotFoundError("Booking not found");
  }

  if (
    userId &&
    booking.userId &&
    booking.userId.toString() !== userId.toString()
  ) {
    throw new NotFoundError("Booking not found");
  }

  return booking;
};

export const getUserTableBookings = async (userId, query) => {
  const { page = 1, limit = 10 } = query;

  const [bookings, total] = await tableBookingRepository.findByUserId(userId, {
    page,
    limit,
  });

  const totalPages = Math.ceil(total / limit);

  return {
    data: bookings,
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

export const listTableBookings = async (query) => {
  const {
    page = 1,
    limit = 10,
    status,
    date,
    dateFrom,
    dateTo,
    search,
    sortBy = "date",
    sortOrder = "asc",
  } = query;

  const filter = {};

  if (status) filter.status = status;

  if (date) {
    filter.date = new Date(date);
  }

  if (dateFrom || dateTo) {
    filter.date = {};

    if (dateFrom) {
      filter.date.$gte = new Date(dateFrom);
    }

    if (dateTo) {
      filter.date.$lte = new Date(dateTo);
    }
  }

  if (search) {
    filter.$or = [
      { bookingNumber: { $regex: search, $options: "i" } },
      { customerName: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const sort = {
    [sortBy]: sortOrder === "desc" ? -1 : 1,
  };

  const [bookings, total] = await tableBookingRepository.findAll(filter, {
    page,
    limit,
    sort,
  });

  const totalPages = Math.ceil(total / limit);

  return {
    data: bookings,
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

export const updateTableBooking = async (bookingId, updateData) => {
  const booking = await tableBookingRepository.findById(bookingId);

  if (!booking) {
    throw new NotFoundError("Booking not found");
  }

  if (
    booking.status === "completed" ||
    booking.status === "cancelled" ||
    booking.status === "no_show"
  ) {
    throw new ConflictError(
      `Cannot update booking in ${booking.status} status`,
    );
  }

  if (updateData.date || updateData.time) {
    const newDate = updateData.date || booking.date;
    const newTime = updateData.time || booking.time;

    const conflict = await tableBookingRepository.findConflict(
      newDate,
      newTime,
      bookingId,
    );

    if (conflict) {
      throw new ConflictError("This time slot is already booked");
    }
  }

  const updatedBooking = await tableBookingRepository.updateById(
    bookingId,
    updateData,
  );

  logger.info("Table booking updated", { bookingId });

  return updatedBooking;
};

export const updateTableBookingStatus = async (
  bookingId,
  newStatus,
  adminId = null,
  note = "",
  tableNumber = "",
) => {
  const booking = await tableBookingRepository.findById(bookingId);

  if (!booking) {
    throw new NotFoundError("Booking not found");
  }

  const allowedTransitions = VALID_TRANSITIONS[booking.status] || [];

  if (!allowedTransitions.includes(newStatus)) {
    throw new ConflictError(
      `Cannot transition from ${booking.status} to ${newStatus}`,
    );
  }

  const updatedBooking = await tableBookingRepository.updateStatus(
    bookingId,
    newStatus,
    adminId,
    note,
    tableNumber,
  );
  if (newStatus === "cancelled") {
    emitAdminEvent(SOCKET_EVENTS.BOOKING_TABLE_CANCELLED, {
      bookingId,
      bookingNumber: booking.bookingNumber,
      status: newStatus,
    });
  } else {
    emitAdminEvent(SOCKET_EVENTS.BOOKING_TABLE_UPDATED, {
      bookingId,
      bookingNumber: booking.bookingNumber,
      status: newStatus,
      tableNumber,
    });
  }
  logger.info("Table booking status updated", {
    bookingId,
    from: booking.status,
    to: newStatus,
    adminId,
  });

  return updatedBooking;
};

export const cancelTableBooking = async (
  bookingId,
  userId = null,
  reason = "",
) => {
  const booking = await tableBookingRepository.findById(bookingId);

  if (!booking) {
    throw new NotFoundError("Booking not found");
  }

  if (
    userId &&
    booking.userId &&
    booking.userId.toString() !== userId.toString()
  ) {
    throw new NotFoundError("Booking not found");
  }

  if (booking.status !== "pending" && booking.status !== "confirmed") {
    throw new ConflictError(
      `Booking cannot be cancelled from ${booking.status} status`,
    );
  }

  const bookingDateTime = new Date(booking.date);
  const [hours, minutes] = booking.time.split(":").map(Number);

  bookingDateTime.setHours(hours, minutes, 0, 0);

  const now = new Date();

  const hoursUntilBooking = (bookingDateTime - now) / (1000 * 60 * 60);

  if (hoursUntilBooking < CANCELLATION_HOURS_LIMIT) {
    throw new BadRequestError(
      `Cancellation requires at least ${CANCELLATION_HOURS_LIMIT} hours notice`,
    );
  }

  const updatedBooking = await tableBookingRepository.updateStatus(
    bookingId,
    "cancelled",
    null,
    reason,
  );

  emitAdminEvent(SOCKET_EVENTS.BOOKING_TABLE_CANCELLED, {
    bookingId,
    bookingNumber: booking.bookingNumber,
    reason,
  });

  logger.info("Table booking cancelled", {
    bookingId,
    userId,
    reason,
  });

  return updatedBooking;
};
