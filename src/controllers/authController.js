const User   = require('../models/User')
const bcrypt = require('bcryptjs')
const jwt    = require('jsonwebtoken')
const { validationResult } = require('express-validator')

// ─────────────────────────────────────
// Helper — create ACCESS token (short lived)
// ─────────────────────────────────────
const createAccessToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // ← only 15 minutes
  )
}

// ─────────────────────────────────────
// Helper — create REFRESH token (long lived)
// ─────────────────────────────────────
const createRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET, // ← different secret!
    { expiresIn: '7d' }
  )
}

// ─────────────────────────────────────
// Helper — set refresh token as httpOnly cookie
// ─────────────────────────────────────
const setRefreshCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,  // JS cannot read this cookie
    secure:   process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict', // prevents CSRF attacks
    maxAge:   7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  })
}

// ─────────────────────────────────────
// REGISTER
// ─────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const { name, email, password } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    })

    // Create both tokens on register
    const accessToken  = createAccessToken(user._id)
    const refreshToken = createRefreshToken(user._id)

    // Set refresh token in cookie
    setRefreshCookie(res, refreshToken)

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      accessToken, // ← only access token in JSON
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

// ─────────────────────────────────────
// LOGIN
// ─────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const { email, password } = req.body

    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    // Create both tokens on login
    const accessToken  = createAccessToken(user._id)
    const refreshToken = createRefreshToken(user._id)

    // Set refresh token in cookie
    setRefreshCookie(res, refreshToken)

    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken, // ← only access token in JSON
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

// ─────────────────────────────────────
// REFRESH — get new access token
// POST /api/auth/refresh
// ─────────────────────────────────────
const refresh = async (req, res, next) => {
  try {
    // Read refresh token from cookie
    const refreshToken = req.cookies.refreshToken

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token. Please login again.'
      })
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)

    // Check user still exists
    const user = await User.findById(decoded.id)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists'
      })
    }

    // Issue brand new access token
    const newAccessToken = createAccessToken(user._id)

    res.status(200).json({
      success: true,
      accessToken: newAccessToken
    })
  } catch (error) {
    // jwt.verify throws error if token expired or invalid
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token. Please login again.'
    })
  }
}

// ─────────────────────────────────────
// LOGOUT — clear refresh token cookie
// POST /api/auth/logout
// ─────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    // Clear the cookie by setting it with maxAge 0
    res.cookie('refreshToken', '', {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   0  // ← expires immediately
    })

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    next(error)
  }
}

// ─────────────────────────────────────
// GET ME
// ─────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user
    })
  } catch (error) {
    next(error)
  }
}

// ─────────────────────────────────────
// UPDATE PROFILE
// ─────────────────────────────────────
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

module.exports = {
  register, login,
  refresh, logout,
  getMe, updateProfile
}