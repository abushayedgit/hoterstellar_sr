/**
 * Basic HTML sanitization for rich text content
 * Removes scripts, event handlers, and dangerous URLs
 * @param {string} html - Input HTML string
 * @returns {string} Sanitized HTML
 */
export const sanitizeHtml = (html) => {
  if (!html) return "";

  return (
    html
      // Remove script tags and their content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      // Remove inline event handlers
      .replace(/on\w+="[^"]*"/g, "")
      .replace(/on\w+='[^']*'/g, "")
      .replace(/on\w+=[^\s>]+/g, "")
      // Remove javascript: URLs
      .replace(/javascript:/gi, "")
      .replace(/vbscript:/gi, "")
      .replace(/data:text\/html/gi, "")
      // Remove iframes
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      // Remove object and embed tags
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
      .replace(/<embed\b[^>]*>/gi, "")
      // Remove meta refresh
      .replace(/<meta[^>]*http-equiv=["']?refresh["']?[^>]*>/gi, "")
      // Remove base tags
      .replace(/<base\b[^>]*>/gi, "")
      // Remove link tags with javascript
      .replace(/<link[^>]*href=["']?javascript:[^>]*>/gi, "")
  );
};

/**
 * Sanitizes plain text (removes all HTML)
 * @param {string} text - Input text
 * @returns {string} Plain text
 */
export const sanitizePlainText = (text) => {
  if (!text) return "";

  return text
    .replace(/<[^>]*>/g, "") // Remove all HTML tags
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
};

/**
 * Validates if HTML string is safe (no scripts or dangerous content)
 * @param {string} html - Input HTML
 * @returns {boolean} True if safe
 */
export const isSafeHtml = (html) => {
  if (!html) return true;

  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /vbscript:/i,
  ];

  return !dangerousPatterns.some((pattern) => pattern.test(html));
};

/**
 * Sanitizes a string for safe use in URLs
 * @param {string} url - Input URL
 * @returns {string} Sanitized URL
 */
export const sanitizeUrl = (url) => {
  if (!url) return "";

  // Only allow http, https URLs
  const safeProtocols = ["http:", "https:"];

  try {
    const parsedUrl = new URL(url);
    if (safeProtocols.includes(parsedUrl.protocol)) {
      return url;
    }
  } catch (error) {
    // Not a valid URL, return empty
  }

  return "";
};

/**
 * Escapes HTML special characters
 * @param {string} text - Input text
 * @returns {string} Escaped text
 */
export const escapeHtml = (text) => {
  if (!text) return "";

  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};
