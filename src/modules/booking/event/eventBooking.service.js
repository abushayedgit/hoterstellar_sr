import { Counter } from "../../../models/counter.model.js";
import { eventBookingRepository } from "./eventBooking.repository.js";
import { NotFoundError } from "../../../errors/NotFoundError.js";
import { BadRequestError } from "../../../errors/BadRequestError.js";
import { ConflictError } from "../../../errors/ConflictError.js";
import { logger } from "../../../utils/logger.js";
import { getBrevoClient } from "../../../config/brevo.js";
import { eventBookingConfirmationTemplate } from "../../../emails/templates/eventBookingConfirmationTemplate.js";
import { adminNewBookingNotificationTemplate } from "../../../emails/templates/adminNewBookingNotificationTemplate.js";
import { emitAdminEvent } from "../../../utils/socketEmitter.js";
import { SOCKET_EVENTS } from "../../../constants/socketEvents.js";

const VALID_TRANSITIONS = {
  pending: ["under_review", "cancelled"],
  under_review: ["quotation_sent", "cancelled"],
  quotation_sent: ["confirmed", "cancelled"],
  confirmed: ["deposit_paid", "cancelled"],
  deposit_paid: ["completed"],
  completed: [],
  cancelled: [],
};

const CANCELLATION_DAYS_LIMIT = 7;

const generateBookingNumber = async () => {
  const seq = await Counter.findOneAndUpdate(
    { key: "eventBookingNumber" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );

  const year = new Date().getFullYear();
  const paddedSeq = String(seq.seq).padStart(6, "0");

  return `EB-${year}-${paddedSeq}`;
};

const sendEventBookingConfirmationEmail = async (booking) => {
  const brevoClient = getBrevoClient();

  if (!brevoClient || !booking.email) {
    return;
  }

  try {
    await brevoClient.sendEmail({
      to: booking.email,
      subject: `Event Booking Confirmed - ${booking.bookingNumber}`,
      html: eventBookingConfirmationTemplate({
        bookingNumber: booking.bookingNumber,
        customerName: booking.customerName,
        eventDate: booking.eventDate.toISOString().split("T")[0],
        eventType: booking.eventType,
        eventDetails: booking.eventDetails,
        guestCount: booking.guestCount,
        specialRequirements: booking.specialRequirements,
      }),
    });
  } catch (error) {
    logger.error("Failed to send event booking confirmation email", {
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
          subject: `New Event Booking - ${booking.bookingNumber}`,
          html: adminNewBookingNotificationTemplate({
            bookingNumber: booking.bookingNumber,
            bookingType: "event",
            customerName: booking.customerName,
            dateTime: booking.eventDate.toISOString().split("T")[0],
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

export const createEventBooking = async (bookingData, userId = null) => {
  const { eventDate } = bookingData;

  const bookingDate = new Date(eventDate);
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  if (bookingDate < today) {
    throw new BadRequestError("Event date must be in the future");
  }

  const bookingNumber = await generateBookingNumber();

  const booking = await eventBookingRepository.create({
    ...bookingData,
    bookingNumber,
    userId,
    eventDate: bookingDate,
    status: "pending",
    statusHistory: [
      {
        status: "pending",
        at: new Date(),
      },
    ],
  });

  await sendEventBookingConfirmationEmail(booking);
  await sendAdminNotificationEmail(booking);

  logger.info("Event booking created", {
    bookingId: booking._id,
    bookingNumber,
  });

  emitAdminEvent(SOCKET_EVENTS.BOOKING_EVENT_NEW, {
    bookingId: booking._id,
    bookingNumber: booking.bookingNumber,
    customerName: booking.customerName,
    eventDate: booking.eventDate,
    guestCount: booking.guestCount,
  });

  return booking;
};

export const getEventBookingById = async (bookingId, userId = null) => {
  const booking = await eventBookingRepository.findById(bookingId);

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

export const getUserEventBookings = async (userId, query) => {
  const { page = 1, limit = 10 } = query;

  const [bookings, total] = await eventBookingRepository.findByUserId(userId, {
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

export const listEventBookings = async (query) => {
  const {
    page = 1,
    limit = 10,
    status,
    eventType,
    dateFrom,
    dateTo,
    search,
    sortBy = "eventDate",
    sortOrder = "asc",
  } = query;

  const filter = {};

  if (status) filter.status = status;
  if (eventType) filter.eventType = eventType;

  if (dateFrom || dateTo) {
    filter.eventDate = {};

    if (dateFrom) {
      filter.eventDate.$gte = new Date(dateFrom);
    }

    if (dateTo) {
      filter.eventDate.$lte = new Date(dateTo);
    }
  }

  if (search) {
    filter.$or = [
      {
        bookingNumber: {
          $regex: search,
          $options: "i",
        },
      },
      {
        customerName: {
          $regex: search,
          $options: "i",
        },
      },
      {
        phone: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  const sort = {
    [sortBy]: sortOrder === "desc" ? -1 : 1,
  };

  const [bookings, total] = await eventBookingRepository.findAll(filter, {
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

export const updateEventBooking = async (bookingId, updateData) => {
  const booking = await eventBookingRepository.findById(bookingId);

  if (!booking) {
    throw new NotFoundError("Booking not found");
  }

  if (booking.status === "completed" || booking.status === "cancelled") {
    throw new ConflictError(
      `Cannot update booking in ${booking.status} status`,
    );
  }

  const updatedBooking = await eventBookingRepository.updateById(
    bookingId,
    updateData,
  );

  logger.info("Event booking updated", {
    bookingId,
  });

  return updatedBooking;
};

export const updateEventBookingStatus = async (
  bookingId,
  newStatus,
  adminId = null,
  note = "",
  additionalData = {},
) => {
  const booking = await eventBookingRepository.findById(bookingId);

  if (!booking) {
    throw new NotFoundError("Booking not found");
  }

  const allowedTransitions = VALID_TRANSITIONS[booking.status] || [];

  if (!allowedTransitions.includes(newStatus)) {
    throw new ConflictError(
      `Cannot transition from ${booking.status} to ${newStatus}`,
    );
  }

  const updatedBooking = await eventBookingRepository.updateStatus(
    bookingId,
    newStatus,
    adminId,
    note,
    additionalData,
  );

  if (newStatus === "cancelled") {
    emitAdminEvent(SOCKET_EVENTS.BOOKING_EVENT_CANCELLED, {
      bookingId,
      bookingNumber: booking.bookingNumber,
      status: newStatus,
    });
  } else {
    emitAdminEvent(SOCKET_EVENTS.BOOKING_EVENT_UPDATED, {
      bookingId,
      bookingNumber: booking.bookingNumber,
      status: newStatus,
    });
  }

  logger.info("Event booking status updated", {
    bookingId,
    from: booking.status,
    to: newStatus,
    adminId,
  });

  return updatedBooking;
};

export const cancelEventBooking = async (
  bookingId,
  userId = null,
  reason = "",
) => {
  const booking = await eventBookingRepository.findById(bookingId);

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

  if (booking.status === "completed" || booking.status === "cancelled") {
    throw new ConflictError(
      `Booking cannot be cancelled from ${booking.status} status`,
    );
  }

  if (booking.status === "confirmed" || booking.status === "deposit_paid") {
    const eventDateTime = new Date(booking.eventDate);

    const now = new Date();

    const daysUntilEvent = (eventDateTime - now) / (1000 * 60 * 60 * 24);

    if (daysUntilEvent < CANCELLATION_DAYS_LIMIT) {
      throw new BadRequestError(
        `Cancellation requires at least ${CANCELLATION_DAYS_LIMIT} days notice`,
      );
    }
  }

  const updatedBooking = await eventBookingRepository.updateStatus(
    bookingId,
    "cancelled",
    null,
    reason,
  );

  logger.info("Event booking cancelled", {
    bookingId,
    userId,
    reason,
  });

  emitAdminEvent(SOCKET_EVENTS.BOOKING_EVENT_CANCELLED, {
    bookingId,
    bookingNumber: booking.bookingNumber,
    reason,
  });

  return updatedBooking;
};
