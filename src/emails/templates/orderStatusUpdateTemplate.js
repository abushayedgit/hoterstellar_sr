import { baseLayout } from "./baseLayout.js";

export const orderStatusUpdateTemplate = ({
  orderNumber,
  customerName,
  status,
  note = "",
}) => {
  const statusColors = {
    pending: "#1B3A5C",
    confirmed: "#1B4332",
    preparing: "#C9A96E",
    ready: "#1B4332",
    out_for_delivery: "#1B3A5C",
    delivered: "#1B4332",
    completed: "#1B4332",
    cancelled: "#8B0000",
  };

  const statusColor = statusColors[status] || "#1B4332";
  const formattedStatus = status.replace(/_/g, " ").toUpperCase();

  const content = `
    <p class="content-text">Dear ${customerName},</p>
    <p class="content-text">
      Your order status has been updated:
    </p>
    
    <div class="card" style="text-align: center;">
      <div class="card-title">Order Number</div>
      <div style="font-size: 20px; color: #1B4332; font-weight: 700; margin: 10px 0;">${orderNumber}</div>
      <div style="display: inline-block; background: ${statusColor}; color: #FFFFFF; padding: 10px 30px; border-radius: 20px; font-size: 14px; font-weight: 600; letter-spacing: 2px; margin: 10px 0;">
        ${formattedStatus}
      </div>
      ${note ? `<p style="font-size: 13px; color: #888; margin-top: 15px;">Note: ${note}</p>` : ""}
    </div>
    
    <p class="content-text">
      Thank you for choosing Hoterstellar. We appreciate your business.
    </p>
  `;

  return baseLayout({
    title: "Order Status Update",
    preheader: `Order ${orderNumber} is now ${formattedStatus}`,
    content,
  });
};
