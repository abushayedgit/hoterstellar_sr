export const CACHE_KEYS = {
  FOODS_LIST: "hoterstellar:foods:list",
  FOOD_DETAIL: (id) => `hoterstellar:food:${id}`,
  CATEGORIES_LIST: "hoterstellar:categories:list",
  BILLBOARD_HERO: "hoterstellar:billboard:hero",
  BILLBOARD_POPUP: (version) => `hoterstellar:billboard:popup:${version}`,
  NOTICES_LIST: "hoterstellar:notices:list",
  ANALYTICS: (period, filterHash) =>
    `hoterstellar:analytics:${period}:${filterHash}`,
  RATE_LIMIT: (tier, identifier) => `hoterstellar:rl:${tier}:${identifier}`,
  OTP_THROTTLE: (email) => `hoterstellar:otp:${email}`,
};
