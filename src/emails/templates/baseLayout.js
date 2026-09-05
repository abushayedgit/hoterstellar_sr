export const baseLayout = ({
  title,
  preheader,
  content,
  year = new Date().getFullYear(),
}) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', Arial, sans-serif;
      background-color: #F8F6F1;
      color: #2C2C2C;
      line-height: 1.6;
    }
    
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FFFFFF;
    }
    
    .header {
      background: linear-gradient(135deg, #1B4332 0%, #1B3A5C 100%);
      padding: 50px 40px 40px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 30% 50%, rgba(201, 169, 110, 0.15) 0%, transparent 60%);
    }
    
    .logo-icon {
      width: 60px;
      height: 60px;
      border: 2px solid #C9A96E;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      position: relative;
      z-index: 1;
    }
    
    .logo-icon svg {
      width: 30px;
      height: 30px;
      fill: #C9A96E;
    }
    
    .hotel-name {
      font-family: 'Playfair Display', serif;
      font-size: 32px;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 5px;
      letter-spacing: 2px;
      position: relative;
      z-index: 1;
    }
    
    .hotel-tagline {
      font-size: 13px;
      color: #C9A96E;
      letter-spacing: 3px;
      text-transform: uppercase;
      font-weight: 500;
      position: relative;
      z-index: 1;
    }
    
    .body-content {
      padding: 50px 40px;
    }
    
    .title {
      font-family: 'Playfair Display', serif;
      font-size: 26px;
      font-weight: 600;
      color: #1B4332;
      margin-bottom: 10px;
      text-align: center;
    }
    
    .divider {
      width: 60px;
      height: 2px;
      background: linear-gradient(90deg, #C9A96E, #1B4332);
      margin: 20px auto 30px;
    }
    
    .content-text {
      font-size: 15px;
      color: #4A4A4A;
      margin-bottom: 25px;
      text-align: center;
    }
    
    .card {
      background: #F8F6F1;
      border: 1px solid #E5E0D5;
      border-radius: 8px;
      padding: 30px;
      margin: 25px 0;
    }
    
    .card-title {
      font-size: 14px;
      color: #1B3A5C;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 20px;
      font-weight: 600;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #E5E0D5;
    }
    
    .info-row:last-child {
      border-bottom: none;
    }
    
    .info-label {
      font-size: 13px;
      color: #888;
      font-weight: 500;
    }
    
    .info-value {
      font-size: 14px;
      color: #2C2C2C;
      font-weight: 600;
    }
    
    .otp-box {
      background: linear-gradient(135deg, #1B4332 0%, #1B3A5C 100%);
      border-radius: 8px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
    }
    
    .otp-code {
      font-size: 42px;
      letter-spacing: 12px;
      color: #C9A96E;
      font-weight: 700;
      font-family: 'Inter', sans-serif;
    }
    
    .otp-label {
      color: #FFFFFF;
      font-size: 13px;
      margin-bottom: 10px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #C9A96E 0%, #B8955E 100%);
      color: #FFFFFF;
      text-decoration: none;
      padding: 14px 40px;
      border-radius: 25px;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin: 20px 0;
      transition: all 0.3s;
    }
    
    .button:hover {
      background: linear-gradient(135deg, #B8955E 0%, #A8824E 100%);
      box-shadow: 0 5px 15px rgba(201, 169, 110, 0.3);
    }
    
    .temp-password {
      background: #F8F6F1;
      border: 2px dashed #C9A96E;
      border-radius: 6px;
      padding: 15px;
      font-family: 'Courier New', monospace;
      font-size: 18px;
      color: #1B4332;
      text-align: center;
      letter-spacing: 2px;
      margin: 20px 0;
    }
    
    .footer {
      background: #1B4332;
      padding: 30px 40px;
      text-align: center;
    }
    
    .footer-logo {
      font-family: 'Playfair Display', serif;
      font-size: 18px;
      color: #C9A96E;
      margin-bottom: 10px;
      letter-spacing: 1px;
    }
    
    .footer-text {
      font-size: 12px;
      color: #888;
      line-height: 1.8;
    }
    
    .social-links {
      margin: 15px 0;
    }
    
    .social-link {
      display: inline-block;
      width: 32px;
      height: 32px;
      border: 1px solid #C9A96E;
      border-radius: 50%;
      margin: 0 5px;
      line-height: 32px;
      color: #C9A96E;
      text-decoration: none;
      font-size: 12px;
    }
    
    .address {
      font-size: 11px;
      color: #666;
      margin-top: 10px;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      <div class="logo-icon">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L1 9l11 7 11-7-11-7z"/>
          <path d="M1 15l11 7 11-7"/>
        </svg>
      </div>
      <div class="hotel-name">Hoterstellar</div>
      <div class="hotel-tagline">Luxury Hotel & Restaurant</div>
    </div>
    
    <div class="body-content">
      <h2 class="title">${title}</h2>
      <div class="divider"></div>
      ${content}
    </div>
    
    <div class="footer">
      <div class="footer-logo">Hoterstellar</div>
      <div class="social-links">
        <a href="#" class="social-link">FB</a>
        <a href="#" class="social-link">IG</a>
        <a href="#" class="social-link">X</a>
      </div>
      <div class="footer-text">
        &copy; ${year} Hoterstellar. All rights reserved.<br>
        <span class="address">
          Luxury Hotel &amp; Fine Dining<br>
          Dhaka, Bangladesh
        </span>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};
