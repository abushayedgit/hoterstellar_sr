import {
  generateRandomToken,
  generateOTP,
  hashToken,
  generateAccessToken,
  generateTokenPair,
} from "../../src/utils/token.utils.js";

describe("Token Utilities", () => {
  test("generateRandomToken returns string", () => {
    const token = generateRandomToken(32);
    expect(typeof token).toBe("string");
    expect(token.length).toBe(64); // hex encoded
  });

  test("generateOTP returns 6-digit string", () => {
    const otp = generateOTP();
    expect(typeof otp).toBe("string");
    expect(otp.length).toBe(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  test("hashToken produces consistent hash", () => {
    const token = "test-token";
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(token);
  });

  test("generateAccessToken creates valid JWT", () => {
    const payload = { sub: "123", role: "admin" };
    const secret = "test-secret-32-chars-long-minimum";
    const token = generateAccessToken(payload, secret, "15m");
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  test("generateTokenPair returns access and refresh tokens", () => {
    const payload = { sub: "123" };
    const secret = "test-secret-32-chars-long-minimum";
    const result = generateTokenPair(payload, secret);
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.refreshTokenHash).toBeDefined();
    expect(result.refreshToken).not.toBe(result.refreshTokenHash);
  });
});
