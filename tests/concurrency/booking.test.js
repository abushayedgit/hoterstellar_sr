import { createTableBooking } from "../../src/modules/booking/table/tableBooking.service.js";

describe("Booking Concurrency", () => {
  test("Simultaneous bookings for same slot should only one succeed", async () => {
    const bookingData = {
      customerName: "Test Customer",
      phone: "1234567890",
      date: "2026-12-15",
      time: "19:00",
      guestCount: 4,
    };

    // Try to create two bookings simultaneously
    const results = await Promise.allSettled([
      createTableBooking(bookingData, null),
      createTableBooking(bookingData, null),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
  });
});
