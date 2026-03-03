const User   = require('../models/User')
const bcrypt = require('bcryptjs')
const jwt    = require('jsonwebtoken')
const { validationResult } = require('express-validator')

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const MAX_LOGIN_ATTEMPTS = 5
const LOCK_DURATION_MS   = 30 * 60 * 1000  // 30 minutes

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

// Create short lived access token — 15 minutes
const createAccessToken = (userId) =>
  jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  )

// Create long lived refresh token — 7 days
const createRefreshToken = (userId) =>
  jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  )

// Set refresh token as httpOnly cookie
// JavaScript cannot read httpOnly cookies
const setRefreshCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   7 * 24 * 60 * 60 * 1000  // 7 days in ms
  })
}

// Check if account is locked
const isAccountLocked = (user) => {
  return user.lockUntil && user.lockUntil > Date.now()
}

// Increment failed attempts and lock if needed
const handleFailedLogin = async (user) => {
  user.loginAttempts += 1
  if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
    user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS)
  }
  await user.save()
}

// Reset attempts on successful login
const resetLoginAttempts = async (user) => {
  user.loginAttempts = 0
  user.lockUntil     = null
  await user.save()
}

// ─────────────────────────────────────────────
// REGISTER
// POST /api/auth/register
// ─────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors:  errors.array()
      })
    }

    const { name, email, password } = req.body

    // Check if email already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      })
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user in database
    const user = await User.create({
      name,
      email,
      password: hashedPassword
    })

    // Create both tokens
    const accessToken  = createAccessToken(user._id)
    const refreshToken = createRefreshToken(user._id)

    // Set refresh token in cookie
    setRefreshCookie(res, refreshToken)

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      accessToken,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role
      }
    })
  } catch (error) {
    next(error)
  }
}

// ─────────────────────────────────────────────
// LOGIN
// POST /api/auth/login
// ─────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors:  errors.array()
      })
    }

    const { email, password } = req.body

    // Find user — include password for comparison
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    // Check if account is locked
    if (isAccountLocked(user)) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000)
      return res.status(423).json({
        success: false,
        message: `Account locked. Try again in ${minutesLeft} minutes.`
      })
    }

    // Compare password with hashed password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      // Increment failed attempts
      await handleFailedLogin(user)

      const attemptsLeft = MAX_LOGIN_ATTEMPTS - user.loginAttempts
      return res.status(401).json({
        success: false,
        message: attemptsLeft > 0
          ? `Invalid email or password. ${attemptsLeft} attempts remaining.`
          : 'Account locked for 30 minutes due to too many failed attempts.'
      })
    }

    // Successful login — reset lockout
    await resetLoginAttempts(user)

    // Create both tokens
    const accessToken  = createAccessToken(user._id)
    const refreshToken = createRefreshToken(user._id)

    // Set refresh token in cookie
    setRefreshCookie(res, refreshToken)

    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role
      }
    })
  } catch (error) {
    next(error)
  }
}

// ─────────────────────────────────────────────
// REFRESH TOKEN
// POST /api/auth/refresh
// ─────────────────────────────────────────────
const refresh = async (req, res, next) => {
  try {
    // Read refresh token from httpOnly cookie
    const refreshToken = req.cookies.refreshToken

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token found. Please login again.'
      })
    }

    // Verify refresh token using REFRESH secret
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)

    // Check user still exists
    const user = await User.findById(decoded.id)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists'
      })
    }

    // Issue new access token
    const newAccessToken = createAccessToken(user._id)

    res.status(200).json({
      success:     true,
      accessToken: newAccessToken
    })
  } catch (error) {
    // jwt.verify throws if token expired or invalid
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token. Please login again.'
    })
  }
}

// ─────────────────────────────────────────────
// LOGOUT
// POST /api/auth/logout
// ─────────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    // Clear refresh token cookie by setting maxAge to 0
    res.cookie('refreshToken', '', {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   0
    })

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    next(error)
  }
}

// ─────────────────────────────────────────────
// GET CURRENT USER
// GET /api/auth/me
// ─────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    // req.user is set by protect middleware
    res.status(200).json({
      success: true,
      user:    req.user
    })
  } catch (error) {
    next(error)
  }
}

// ─────────────────────────────────────────────
// UPDATE PROFILE
// PUT /api/auth/profile
// ─────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { name, bio } = req.body

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, bio },
      { new: true, runValidators: true }
    ).select('-password')

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    })
  } catch (error) {
    next(error)
  }
}

// ─────────────────────────────────────────────
// CHANGE PASSWORD
// PUT /api/auth/change-password
// ─────────────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Both current and new password are required'
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      })
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password')

    // Check current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      })
    }

    // Hash and save new password
    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  updateProfile,
  changePassword
}