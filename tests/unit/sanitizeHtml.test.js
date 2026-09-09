import {
  sanitizeHtml,
  sanitizePlainText,
  isSafeHtml,
  sanitizeUrl,
  escapeHtml,
} from "../../src/utils/sanitizeHtml.js";

describe("HTML Sanitization", () => {
  test("removes script tags", () => {
    const html = '<p>Hello</p><script>alert("xss")</script>';
    const sanitized = sanitizeHtml(html);
    expect(sanitized).not.toContain("<script");
    expect(sanitized).toContain("<p>Hello</p>");
  });

  test("removes inline event handlers", () => {
    const html = '<button onclick="alert(1)">Click</button>';
    const sanitized = sanitizeHtml(html);
    expect(sanitized).not.toContain("onclick");
  });

  test("removes javascript: URLs", () => {
    const html = '<a href="javascript:alert(1)">Link</a>';
    const sanitized = sanitizeHtml(html);
    expect(sanitized).not.toContain("javascript:");
  });

  test("removes iframes", () => {
    const html = '<iframe src="https://evil.com"></iframe>';
    const sanitized = sanitizeHtml(html);
    expect(sanitized).not.toContain("<iframe");
  });

  test("isSafeHtml detects dangerous content", () => {
    expect(isSafeHtml("<script>alert(1)</script>")).toBe(false);
    expect(isSafeHtml("<p>Safe content</p>")).toBe(true);
  });
});

describe("Plain Text Sanitization", () => {
  test("removes all HTML tags", () => {
    const text = "<p>Hello <strong>World</strong></p>";
    const sanitized = sanitizePlainText(text);
    expect(sanitized).toBe("Hello World");
  });

  test("decodes HTML entities", () => {
    const text = "&lt;Hello&gt; &amp; &quot;World&quot;";
    const sanitized = sanitizePlainText(text);
    expect(sanitized).toBe('<Hello> & "World"');
  });

  test("handles empty input", () => {
    expect(sanitizePlainText("")).toBe("");
    expect(sanitizePlainText(null)).toBe("");
    expect(sanitizePlainText(undefined)).toBe("");
  });

  test("removes script content", () => {
    const text = '<script>alert("xss")</script><p>Safe</p>';
    const sanitized = sanitizePlainText(text);
    expect(sanitized).not.toContain("alert");
    expect(sanitized).toContain("Safe");
  });
});

describe("URL Sanitization", () => {
  test("allows http URLs", () => {
    const url = "http://example.com";
    expect(sanitizeUrl(url)).toBe(url);
  });

  test("allows https URLs", () => {
    const url = "https://example.com";
    expect(sanitizeUrl(url)).toBe(url);
  });

  test("blocks javascript URLs", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBe("");
  });

  test("blocks invalid URLs", () => {
    expect(sanitizeUrl("not-a-url")).toBe("");
  });
});

describe("HTML Escaping", () => {
  test("escapes special characters", () => {
    const text = '<script>alert("xss")</script>';
    const escaped = escapeHtml(text);
    expect(escaped).not.toContain("<script>");
    expect(escaped).toContain("&lt;script&gt;");
  });

  test("handles empty input", () => {
    expect(escapeHtml("")).toBe("");
    expect(escapeHtml(null)).toBe("");
  });
});
