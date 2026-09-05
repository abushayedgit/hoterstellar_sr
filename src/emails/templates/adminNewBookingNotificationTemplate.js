import { baseLayout } from "./baseLayout.js";

export const adminNewBookingNotificationTemplate = ({
  bookingNumber,
  bookingType,
  customerName,
  dateTime,
  guestCount,
}) => {
  const isTable = bookingType === "table";
  const title = isTable ? "New Table Reservation" : "New Event Booking";

  const content = `
    <p class="content-text">New ${bookingType} booking received:</p>
    
    <div class="card">
      <div class="card-title">Booking Details</div>
      <div class="info-row">
        <span class="info-label">Booking Number</span>
        <span class="info-value">${bookingNumber}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Customer</span>
        <span class="info-value">${customerName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date & Time</span>
        <span class="info-value">${dateTime}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Guests</span>
        <span class="info-value">${guestCount} persons</span>
      </div>
    </div>
    
    <p class="content-text">
      Please check the admin dashboard to manage this booking.
    </p>
  `;

  return baseLayout({
    title,
    preheader: `New ${bookingType} booking ${bookingNumber}`,
    content,
  });
};
