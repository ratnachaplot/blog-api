const express      = require('express')
const cors         = require('cors')
const path         = require('path')
const cookieParser = require('cookie-parser') // ← NEW

const authRoutes     = require('./routes/authRoutes')
const postRoutes     = require('./routes/postRoutes')
const commentRoutes  = require('./routes/commentRoutes')
const likeRoutes     = require('./routes/likeRoutes')
const errorMiddleware = require('./middleware/errorMiddleware')

const app = express()

app.use(cors({
  origin:      'http://localhost:5173', // frontend URL
  credentials: true  // ← NEW — allows cookies to be sent cross-origin
}))
app.use(express.json())
app.use(cookieParser()) // ← NEW — reads cookies from every request

app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.use('/api/auth',  authRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/posts', commentRoutes)
app.use('/api/posts', likeRoutes)

app.get('/health', (req, res) => {
  res.json({ status: '✅ Blog API is running!' })
})

app.use(errorMiddleware)

module.exports = app

