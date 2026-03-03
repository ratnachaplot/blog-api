const rateLimit = require('express-rate-limit')

// General limit — applied to all routes
// 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  message: {
    success: false,
    message: 'Too many requests. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders:   false
})

// Auth limit — applied to login and register only
// 10 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message: {
    success: false,
    message: 'Too many auth attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders:   false
})

module.exports = { apiLimiter, authLimiter }