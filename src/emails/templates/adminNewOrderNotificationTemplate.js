import { baseLayout } from "./baseLayout.js";

export const adminNewOrderNotificationTemplate = ({
  orderNumber,
  customerName,
  orderType,
  totalAmount,
  itemCount,
  orderTime,
}) => {
  const content = `
    <p class="content-text">New order received:</p>
    
    <div class="card">
      <div class="card-title">Order Details</div>
      <div class="info-row">
        <span class="info-label">Order Number</span>
        <span class="info-value">${orderNumber}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Customer</span>
        <span class="info-value">${customerName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Order Type</span>
        <span class="info-value" style="text-transform: capitalize;">${orderType}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Items</span>
        <span class="info-value">${itemCount} items</span>
      </div>
      <div class="info-row">
        <span class="info-label">Total Amount</span>
        <span class="info-value" style="color: #C9A96E; font-size: 16px; font-weight: 700;">৳${totalAmount.toFixed(2)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Time</span>
        <span class="info-value">${orderTime}</span>
      </div>
    </div>
    
    <p class="content-text">
      Please check the admin dashboard to process this order.
    </p>
  `;

  return baseLayout({
    title: "New Order Received",
    preheader: `New order ${orderNumber} received`,
    content,
  });
};
