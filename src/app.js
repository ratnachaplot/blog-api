const express        = require('express')
const cors           = require('cors')
const path           = require('path')
const cookieParser   = require('cookie-parser')
const { apiLimiter } = require('./middleware/rateLimitMiddleware')
const errorMiddleware = require('./middleware/errorMiddleware')

const authRoutes    = require('./routes/authRoutes')
const postRoutes    = require('./routes/postRoutes')
const commentRoutes = require('./routes/commentRoutes')
const likeRoutes    = require('./routes/likeRoutes')

const app = express()

// Middlewares
app.use(cors({
  origin:      process.env.BASE_URL || 'http://localhost:5173',
  credentials: true  // required for cookies to work cross-origin
}))
app.use(express.json())
app.use(cookieParser())       // reads cookies from requests
app.use(apiLimiter)           // rate limit all routes

// Serve uploaded images as static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Routes
app.use('/api/auth',  authRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/posts', commentRoutes)
app.use('/api/posts', likeRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: '✅ Blog API is running!' })
})

// Global error handler — must always be last
app.use(errorMiddleware)

module.exports = app