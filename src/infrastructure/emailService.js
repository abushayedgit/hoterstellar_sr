import { getBrevoClient } from "../config/brevo.js";
import { enqueueJob, QUEUE_NAMES } from "../config/queue.js";
import { logger } from "../utils/logger.js";
import {
  adminWelcomeTemplate,
  adminPasswordResetTemplate,
  userOtpTemplate,
  orderConfirmationTemplate,
  orderStatusUpdateTemplate,
  tableBookingConfirmationTemplate,
  eventBookingConfirmationTemplate,
  adminNewOrderNotificationTemplate,
  adminNewBookingNotificationTemplate,
} from "../emails/templates/index.js";

export const sendEmail = async (to, subject, html, text = "") => {
  const brevoClient = getBrevoClient();

  if (!brevoClient) {
    logger.warn("Brevo not configured, email not sent", { to, subject });
    return false;
  }

  try {
    await brevoClient.sendEmail({ to, subject, html, text });
    logger.info("Email sent", { to, subject });
    return true;
  } catch (error) {
    logger.error("Email send failed", { to, subject, error: error.message });
    throw error;
  }
};

export const enqueueEmail = async (
  to,
  subject,
  html,
  text = "",
  dedupeKey = null,
) => {
  const jobOptions = {
    jobId: dedupeKey || `${to}:${subject}:${Date.now()}`,
  };

  return enqueueJob(
    QUEUE_NAMES.EMAIL,
    "sendEmail",
    { to, subject, html, text },
    jobOptions,
  );
};

// Specific email functions
export const sendAdminWelcomeEmail = async (admin) => {
  const html = adminWelcomeTemplate({
    name: admin.name,
    email: admin.email,
    tempPassword: admin.tempPassword,
    loginUrl: `${process.env.CLIENT_DASHBOARD_URL || "http://localhost:3001"}/login`,
  });

  return enqueueEmail(
    admin.email,
    "Welcome to Hoterstellar Admin Team",
    html,
    "",
    `admin-welcome:${admin.email}:${admin._id}`,
  );
};

export const sendAdminPasswordResetEmail = async (admin, resetUrl) => {
  const html = adminPasswordResetTemplate({
    name: admin.name,
    resetUrl,
  });

  return enqueueEmail(
    admin.email,
    "Password Reset Request - Hoterstellar",
    html,
    "",
    `admin-reset:${admin.email}:${Date.now()}`,
  );
};

export const sendUserOtpEmail = async (email, name, otp, purpose) => {
  const html = userOtpTemplate({
    name: name || "Guest",
    otp,
    purpose,
  });

  return enqueueEmail(
    email,
    `${purpose === "signup" ? "Verify Your Email" : "Sign In Verification"} - Hoterstellar`,
    html,
    "",
    `otp:${email}:${purpose}`,
  );
};

export const sendOrderConfirmationEmail = async (order) => {
  const html = orderConfirmationTemplate({
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    items: order.items,
    subtotal: order.subtotal,
    discountTotal: order.discountTotal,
    taxTotal: order.taxTotal,
    totalAmount: order.totalAmount,
    orderType: order.orderType,
    orderDate: new Date(order.createdAt).toISOString().split("T")[0],
  });

  return enqueueEmail(
    order.email,
    `Order Confirmation - ${order.orderNumber}`,
    html,
    "",
    `order-confirmation:${order._id}`,
  );
};

export const sendOrderStatusUpdateEmail = async (
  order,
  newStatus,
  note = "",
) => {
  const html = orderStatusUpdateTemplate({
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    status: newStatus,
    note,
  });

  return enqueueEmail(
    order.email,
    `Order Status Update - ${order.orderNumber}`,
    html,
    "",
    `order-status:${order._id}:${newStatus}:${Date.now()}`,
  );
};

export const sendTableBookingConfirmationEmail = async (booking) => {
  const html = tableBookingConfirmationTemplate({
    bookingNumber: booking.bookingNumber,
    customerName: booking.customerName,
    date: new Date(booking.date).toISOString().split("T")[0],
    time: booking.time,
    guestCount: booking.guestCount,
    tablePreference: booking.tablePreference,
    specialRequests: booking.specialRequests,
  });

  return enqueueEmail(
    booking.email,
    `Table Reservation Confirmed - ${booking.bookingNumber}`,
    html,
    "",
    `table-booking:${booking._id}`,
  );
};

export const sendEventBookingConfirmationEmail = async (booking) => {
  const html = eventBookingConfirmationTemplate({
    bookingNumber: booking.bookingNumber,
    customerName: booking.customerName,
    eventDate: new Date(booking.eventDate).toISOString().split("T")[0],
    eventType: booking.eventType,
    eventDetails: booking.eventDetails,
    guestCount: booking.guestCount,
    specialRequirements: booking.specialRequirements,
  });

  return enqueueEmail(
    booking.email,
    `Event Booking Confirmed - ${booking.bookingNumber}`,
    html,
    "",
    `event-booking:${booking._id}`,
  );
};

export const sendAdminNewOrderNotificationEmail = async (order) => {
  const adminEmails = process.env.ADMIN_NOTIFICATION_EMAILS?.split(",") || [];

  for (const adminEmail of adminEmails) {
    if (!adminEmail) continue;

    const html = adminNewOrderNotificationTemplate({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      orderType: order.orderType,
      totalAmount: order.totalAmount,
      itemCount: order.items.length,
      orderTime: new Date(order.createdAt).toISOString(),
    });

    await enqueueEmail(
      adminEmail,
      `New Order Received - ${order.orderNumber}`,
      html,
      "",
      `admin-order:${order._id}:${adminEmail}`,
    );
  }
};

export const sendAdminNewBookingNotificationEmail = async (
  booking,
  bookingType,
) => {
  const adminEmails = process.env.ADMIN_NOTIFICATION_EMAILS?.split(",") || [];

  for (const adminEmail of adminEmails) {
    if (!adminEmail) continue;

    const html = adminNewBookingNotificationTemplate({
      bookingNumber: booking.bookingNumber,
      bookingType,
      customerName: booking.customerName,
      dateTime:
        bookingType === "table"
          ? `${new Date(booking.date).toISOString().split("T")[0]} ${booking.time}`
          : new Date(booking.eventDate).toISOString().split("T")[0],
      guestCount: booking.guestCount,
    });

    await enqueueEmail(
      adminEmail,
      `New ${bookingType === "table" ? "Table" : "Event"} Booking - ${booking.bookingNumber}`,
      html,
      "",
      `admin-booking:${booking._id}:${bookingType}:${adminEmail}`,
    );
  }
};
