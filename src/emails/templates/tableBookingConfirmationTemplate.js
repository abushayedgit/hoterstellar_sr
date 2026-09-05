import { baseLayout } from "./baseLayout.js";

export const tableBookingConfirmationTemplate = ({
  bookingNumber,
  customerName,
  date,
  time,
  guestCount,
  tablePreference = "",
  specialRequests = "",
}) => {
  const content = `
    <p class="content-text">Dear ${customerName},</p>
    <p class="content-text">
      Your table reservation at Hoterstellar has been confirmed. We look forward to serving you.
    </p>
    
    <div class="card">
      <div class="card-title">Reservation Details</div>
      <div class="info-row">
        <span class="info-label">Booking Number</span>
        <span class="info-value">${bookingNumber}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date</span>
        <span class="info-value">${date}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Time</span>
        <span class="info-value">${time}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Guests</span>
        <span class="info-value">${guestCount} persons</span>
      </div>
      ${
        tablePreference
          ? `
      <div class="info-row">
        <span class="info-label">Table Preference</span>
        <span class="info-value">${tablePreference}</span>
      </div>
      `
          : ""
      }
      ${
        specialRequests
          ? `
      <div class="info-row">
        <span class="info-label">Special Requests</span>
        <span class="info-value">${specialRequests}</span>
      </div>
      `
          : ""
      }
    </div>
    
    <p class="content-text">
      If you need to modify or cancel your reservation, please contact us at least 2 hours before your reservation time.
    </p>
  `;

  return baseLayout({
    title: "Table Reservation Confirmed",
    preheader: `Your table booking ${bookingNumber} is confirmed`,
    content,
  });
};
