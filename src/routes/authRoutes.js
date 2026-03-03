const express  = require('express')
const router   = express.Router()
const { body } = require('express-validator')
const {
  register,
  login,
  refresh,
  logout,
  getMe,
  updateProfile,
  changePassword
} = require('../controllers/authController')
const protect = require('../middleware/authMiddleware')
const { authLimiter } = require('../middleware/rateLimitMiddleware')

// Validation rules for register
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
]

// Validation rules for login
const loginValidation = [
  body('email')
    .isEmail().withMessage('Please enter a valid email'),
  body('password')
    .notEmpty().withMessage('Password is required')
]

// Public routes
router.post('/register',        authLimiter, registerValidation, register)
router.post('/login',           authLimiter, loginValidation,    login)
router.post('/refresh',                      refresh)
router.post('/logout',                       logout)

// Protected routes — require valid access token
router.get('/me',               protect, getMe)
router.put('/profile',          protect, updateProfile)
router.put('/change-password',  protect, changePassword)

module.exports = router