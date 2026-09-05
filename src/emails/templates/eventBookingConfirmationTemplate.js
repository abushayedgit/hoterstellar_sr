import { baseLayout } from "./baseLayout.js";

export const eventBookingConfirmationTemplate = ({
  bookingNumber,
  customerName,
  eventDate,
  eventType,
  eventDetails = "",
  guestCount,
  specialRequirements = "",
}) => {
  const content = `
    <p class="content-text">Dear ${customerName},</p>
    <p class="content-text">
      We are delighted to confirm your event booking at Hoterstellar.
    </p>
    
    <div class="card">
      <div class="card-title">Event Details</div>
      <div class="info-row">
        <span class="info-label">Booking Number</span>
        <span class="info-value">${bookingNumber}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Event Date</span>
        <span class="info-value">${eventDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Event Type</span>
        <span class="info-value">${eventType}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Guests</span>
        <span class="info-value">${guestCount} persons</span>
      </div>
      ${
        eventDetails
          ? `
      <div class="info-row">
        <span class="info-label">Details</span>
        <span class="info-value">${eventDetails}</span>
      </div>
      `
          : ""
      }
      ${
        specialRequirements
          ? `
      <div class="info-row">
        <span class="info-label">Special Requirements</span>
        <span class="info-value">${specialRequirements}</span>
      </div>
      `
          : ""
      }
    </div>
    
    <p class="content-text">
      Our event coordinator will contact you shortly to discuss the arrangements.
    </p>
  `;

  return baseLayout({
    title: "Event Booking Confirmed",
    preheader: `Your event booking ${bookingNumber} is confirmed`,
    content,
  });
};
