# 📝 Blog REST API

> A production-grade REST API built with Node.js, Express, and MongoDB featuring a complete authentication system with JWT refresh tokens, account lockout, rate limiting, blog post management, comments, likes, and file uploads.

---

## 🌐 Live Demo

| | Link |
|---|---|
| **API Base URL** | https://blog-api-hcbo.onrender.com |
| **Health Check** | https://blog-api-hcbo.onrender.com/health |
| **GitHub** | https://github.com/ratnachaplot/blog-api |

---

## ✨ Features

### 🔐 Authentication
- Register and login with JWT authentication
- Access token — short lived (15 minutes)
- Refresh token — long lived (7 days) stored in httpOnly cookie
- Logout clears refresh token cookie
- Change password (requires current password)
- Account lockout after 5 failed login attempts (30 min)
- Rate limiting on auth routes (10 req / 15 min)
- General rate limiting on all routes (100 req / 15 min)
- Role based access control (user vs admin)

### 📄 Posts
- Create post with optional image thumbnail (Multer)
- Get all posts with pagination, search, and filters
- Get single post — auto increments view count
- Update post — author or admin only
- Delete post — author or admin only (also deletes all comments)

### 💬 Comments
- Add comment to any post
- Get all comments for a post
- Delete comment — author or admin only

### ❤️ Likes
- Like a post
- Unlike a post
- Like count tracked on every post

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | Runtime environment |
| Express.js | Web framework |
| MongoDB Atlas | Cloud database |
| Mongoose | ODM for MongoDB |
| jsonwebtoken | JWT access and refresh tokens |
| bcryptjs | Password hashing |
| Multer | Image/file uploads |
| express-validator | Input validation |
| express-rate-limit | Rate limiting |
| cookie-parser | Reading httpOnly cookies |
| dotenv | Environment variables |

---

## 📁 Project Structure

```
blog-api/
├── src/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # Register, login, refresh, logout, profile
│   │   ├── postController.js      # Post CRUD + pagination + search + filter
│   │   ├── commentController.js   # Add, get, delete comments
│   │   └── likeController.js      # Like and unlike posts
│   ├── middleware/
│   │   ├── authMiddleware.js      # Verifies JWT access token
│   │   ├── adminMiddleware.js     # Checks admin role
│   │   ├── uploadMiddleware.js    # Multer config for image uploads
│   │   ├── rateLimitMiddleware.js # API and auth rate limiters
│   │   └── errorMiddleware.js     # Global error handler
│   ├── models/
│   │   ├── User.js                # User schema with lockout fields
│   │   ├── Post.js                # Post schema with likes array
│   │   └── Comment.js             # Comment schema
│   ├── routes/
│   │   ├── authRoutes.js          # Auth endpoints
│   │   ├── postRoutes.js          # Post endpoints
│   │   ├── commentRoutes.js       # Comment endpoints
│   │   └── likeRoutes.js          # Like endpoints
│   └── app.js                     # Express app setup
├── uploads/                       # Uploaded images stored here
├── .env
├── .gitignore
├── package.json
└── server.js                      # Entry point
```

---

## 🔌 API Endpoints

### Auth Routes
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | /api/auth/register | ❌ | Create new account |
| POST | /api/auth/login | ❌ | Login → returns access token |
| POST | /api/auth/refresh | ❌ | Get new access token using cookie |
| POST | /api/auth/logout | ❌ | Clears refresh token cookie |
| GET | /api/auth/me | ✅ | Get current logged in user |
| PUT | /api/auth/profile | ✅ | Update name and bio |
| PUT | /api/auth/change-password | ✅ | Change password |

### Post Routes
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | /api/posts | ✅ | Create post with optional image |
| GET | /api/posts | ❌ | Get all posts (pagination + search + filter) |
| GET | /api/posts/:id | ❌ | Get single post |
| PUT | /api/posts/:id | ✅ | Update post (author or admin only) |
| DELETE | /api/posts/:id | ✅ | Delete post (author or admin only) |

### Comment Routes
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | /api/posts/:id/comments | ✅ | Add comment to post |
| GET | /api/posts/:id/comments | ❌ | Get all comments for post |
| DELETE | /api/posts/comments/:id | ✅ | Delete comment (author or admin only) |

### Like Routes
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | /api/posts/:id/like | ✅ | Like a post |
| DELETE | /api/posts/:id/like | ✅ | Unlike a post |

---

## 🔍 Query Parameters — GET /api/posts

| Parameter | Type | Example | Description |
|---|---|---|---|
| page | Number | ?page=2 | Page number (default: 1) |
| limit | Number | ?limit=5 | Results per page (default: 10) |
| search | String | ?search=react | Search in title and content |
| category | String | ?category=Technology | Filter by category |
| author | String | ?author=USER_ID | Filter by author |
| sortBy | String | ?sortBy=views | Sort field (default: createdAt) |
| order | String | ?order=asc | Sort order asc or desc (default: desc) |

---

## ⚙️ Run Locally

### Prerequisites
- Node.js v18+
- MongoDB Atlas account

### Steps
```bash
git clone https://github.com/ratnachaplot/blog-api.git
cd blog-api
npm install
mkdir uploads
```

Create `.env` file in root:
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=myBlogApiSecret2024!MakeThisLong
JWT_REFRESH_SECRET=myRefreshSecret2024!MakeThisDifferent
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000
```

```bash
npm run dev
# API runs on http://localhost:3000
# Test: GET http://localhost:3000/health
```

---

## 🧠 Key Implementation Details

### Two Token Auth System

Access tokens expire in 15 minutes and are sent in the JSON login response. Refresh tokens expire in 7 days and are stored in httpOnly cookies — meaning JavaScript cannot read them, which protects against XSS attacks. When the access token expires, the client calls `POST /api/auth/refresh`. The server reads the refresh token from the cookie, verifies it, and issues a brand new access token. The user never has to login again until the refresh token itself expires.

```
Login response:
{
  "accessToken": "eyJ..."   ← 15 min, stored by client
}
+ refreshToken cookie set automatically (7 days, httpOnly)
```

### Why Two Different Secrets

`JWT_SECRET` signs access tokens. `JWT_REFRESH_SECRET` signs refresh tokens. Using different secrets means a refresh token cannot be passed as an access token to protected routes — they are verified with different secrets so they cannot be swapped or confused.

### Account Lockout

The `loginAttempts` counter and `lockUntil` timestamp are stored on the User document. Every wrong password increments the counter. On the 5th wrong attempt, `lockUntil` is set to 30 minutes in the future. Every login request first checks if `lockUntil` is in the future — if yes, the user is blocked with a message showing minutes remaining. On successful login, both fields are reset to zero.

### Rate Limiting Strategy

Two tiers of rate limiting protect the API. General rate limiting (100 req / 15 min) applies to all routes to prevent server overload. Strict auth rate limiting (10 req / 15 min) applies specifically to login and register to prevent brute force attacks.

### Pagination

```javascript
skip = (page - 1) * limit
// page 3, limit 10 → skip first 20 documents
```

Every paginated response includes `total`, `page`, `totalPages`, and `count` so the frontend can build a complete pagination UI.

### Authorization Check Pattern

Both post and comment delete endpoints check ownership before allowing deletion:

```javascript
if (resource.author.toString() !== req.user._id.toString() 
    && req.user.role !== 'admin') {
  return res.status(403).json({ message: 'Not authorized' })
}
```

This pattern — author OR admin can delete — is used consistently across posts and comments.

---

## 🐛 Challenges Faced & Solved

| Challenge | Solution |
|---|---|
| Refresh token security | Stored in httpOnly cookie — JavaScript cannot read it even during XSS attack |
| Token confusion | Used separate JWT_SECRET and JWT_REFRESH_SECRET so tokens cannot be used interchangeably |
| Brute force attacks | Rate limiting on auth routes + account lockout after 5 failed attempts |
| File upload validation | Multer fileFilter checks mimetype before saving — only image files allowed |
| Cascade delete | When post is deleted, all its comments deleted too using Comment.deleteMany |
| Password not returning | Added select: false on password field in schema — must use .select('+password') when needed |

---

## 🚀 Deployment

Deployed on **Render** free tier.

### Environment Variables on Render
```
MONGO_URI           → MongoDB Atlas connection string
JWT_SECRET          → secret for access tokens
JWT_REFRESH_SECRET  → secret for refresh tokens
BASE_URL            → https://blog-api-hcbo.onrender.com
NODE_ENV            → production
```

### Build and Start Commands
```
Build Command: npm install
Start Command: node server.js
```

> Note: Render free tier spins down after 15 min of inactivity. First request may take 30-60 seconds to wake the server.

---

## 📮 Testing with Postman

### Recommended Test Order
```
1.  POST /api/auth/register
2.  POST /api/auth/login          → copy accessToken
3.  GET  /api/auth/me             → paste token in Authorization header
4.  POST /api/posts               → create a post (form-data)
5.  GET  /api/posts               → get all posts
6.  GET  /api/posts?search=react  → test search
7.  GET  /api/posts?page=1&limit=5
8.  GET  /api/posts/:id           → single post
9.  POST /api/posts/:id/like      → like post
10. POST /api/posts/:id/comments  → add comment
11. GET  /api/posts/:id/comments  → get comments
12. PUT  /api/auth/change-password
13. POST /api/auth/refresh        → get new access token
14. POST /api/auth/logout         → cookie cleared
15. Test lockout → wrong password 5 times
```

### Authorization Header
```
Key:   Authorization
Value: Bearer YOUR_ACCESS_TOKEN_HERE
```

### Create Post — form-data fields
```
title    → My First Blog Post About React
content  → React is a JavaScript library for building user interfaces...
category → Technology
tags     → react,javascript
thumbnail → (optional image file)
```

---

## 🔮 Future Improvements

- [ ] Email verification on register
- [ ] Forgot password via email
- [ ] Bookmark posts
- [ ] Follow / Unfollow users
- [ ] Token blacklist for immediate logout on all devices
- [ ] Swagger / OpenAPI documentation
- [ ] Google OAuth login

