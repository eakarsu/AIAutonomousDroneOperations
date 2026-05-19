const rateLimit = require('express-rate-limit');

// express-rate-limit v8 requires using ipKeyGenerator for IP fallback to handle IPv6
const { ipKeyGenerator } = rateLimit;

// 20 AI requests per user per hour
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  keyGenerator: (req) => {
    // Key by user id from JWT (set by authMiddleware) or IP as fallback
    if (req.user && req.user.id) return `user_${req.user.id}`;
    return ipKeyGenerator(req);
  },
  message: { error: 'Too many AI requests. Limit is 20 per hour per user. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 100 general requests per 15 minutes per user/IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  keyGenerator: (req) => {
    if (req.user && req.user.id) return `user_${req.user.id}`;
    return ipKeyGenerator(req);
  },
  message: { error: 'Too many requests. Limit is 100 per 15 minutes. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { aiRateLimiter, generalLimiter };
