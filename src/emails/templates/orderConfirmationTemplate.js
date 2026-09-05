import { baseLayout } from "./baseLayout.js";

export const orderConfirmationTemplate = ({
  orderNumber,
  customerName,
  items,
  subtotal,
  discountTotal,
  taxTotal,
  totalAmount,
  orderType,
  orderDate,
}) => {
  const itemsHtml = items
    .map(
      (item) => `
    <div class="info-row">
      <span class="info-label">${item.name} × ${item.quantity}</span>
      <span class="info-value">৳${item.lineTotal.toFixed(2)}</span>
    </div>
  `,
    )
    .join("");

  const content = `
    <p class="content-text">Dear ${customerName},</p>
    <p class="content-text">
      Thank you for your order at Hoterstellar. We are pleased to confirm your order details:
    </p>
    
    <div class="card">
      <div class="card-title">Order Summary</div>
      <div class="info-row">
        <span class="info-label">Order Number</span>
        <span class="info-value">${orderNumber}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Order Date</span>
        <span class="info-value">${orderDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Order Type</span>
        <span class="info-value" style="text-transform: capitalize;">${orderType}</span>
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">Items</div>
      ${itemsHtml}
    </div>
    
    <div class="card">
      <div class="card-title">Payment Summary</div>
      <div class="info-row">
        <span class="info-label">Subtotal</span>
        <span class="info-value">৳${subtotal.toFixed(2)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Discount</span>
        <span class="info-value">-৳${discountTotal.toFixed(2)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Tax</span>
        <span class="info-value">৳${taxTotal.toFixed(2)}</span>
      </div>
      <div class="info-row" style="border-top: 2px solid #C9A96E; margin-top: 10px; padding-top: 15px;">
        <span class="info-label" style="font-size: 15px; color: #1B4332; font-weight: 700;">Total Amount</span>
        <span class="info-value" style="font-size: 18px; color: #C9A96E; font-weight: 700;">৳${totalAmount.toFixed(2)}</span>
      </div>
    </div>
    
    <p class="content-text">
      We will notify you when your order is being prepared and ready for ${orderType === "delivery" ? "delivery" : orderType === "pickup" ? "pickup" : "serving"}.
    </p>
  `;

  return baseLayout({
    title: "Order Confirmation",
    preheader: `Your order ${orderNumber} is confirmed`,
    content,
  });
};
