# 📝 Blog REST API

> A production-grade RESTful API built with Node.js, Express, and MongoDB. Features complete authentication with JWT access tokens and refresh tokens, role-based access control, file uploads, pagination, search, and full CRUD operations for a blogging platform.

---

## 🌐 Links

| | Link |
|---|---|
| **Live API** | https://blog-api-xxxx.onrender.com |
| **GitHub** | https://github.com/ratnachaplot/blog-api |

---

## ✨ Features

### 🔐 Authentication (Production Grade)
- Register and login with JWT authentication
- Access tokens (15 min) + Refresh tokens (7 days)
- Refresh token stored in httpOnly cookie (XSS safe)
- Logout clears refresh token cookie
- Auto token renewal via `/api/auth/refresh`
- Role based access — user vs admin
- Input validation on all auth routes

### 📄 Posts
- Full CRUD — create, read, update, delete
- Thumbnail image upload with Multer
- Categories and tags support
- View count tracking
- Pagination — get posts page by page
- Search posts by title or content
- Filter by category or author
- Sort by date, views, or likes
- Only author or admin can update/delete

### 💬 Comments
- Add comments to any post
- Get all comments for a post
- Delete own comment (or admin deletes any)

### ❤️ Likes
- Like and unlike posts
- Prevents duplicate likes
- Live like count on every post

### 🛡️ Security
- bcrypt password hashing (10 salt rounds)
- JWT access token expires in 15 minutes
- Refresh token in httpOnly cookie (JavaScript cannot read)
- Different secrets for access and refresh tokens
- Global error handling middleware
- Input validation with express-validator

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | Web framework |
| MongoDB Atlas | Cloud database |
| Mongoose | MongoDB ODM with schema validation |
| JWT (jsonwebtoken) | Stateless authentication |
| bcryptjs | Password hashing |
| Multer | File upload handling |
| cookie-parser | Read httpOnly cookies |
| express-validator | Request input validation |
| cors | Cross-origin resource sharing |
| dotenv | Environment variable management |

---

## 📁 Project Structure

```
blog-api/
├── src/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # Register, login, refresh, logout
│   │   ├── postController.js      # CRUD + pagination + search
│   │   ├── commentController.js   # Add, get, delete comments
│   │   └── likeController.js      # Like and unlike posts
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT verify, attach req.user
│   │   ├── adminMiddleware.js     # Role check — admin only
│   │   ├── uploadMiddleware.js    # Multer config + file filter
│   │   └── errorMiddleware.js     # Global error handler
│   ├── models/
│   │   ├── User.js                # User schema with role
│   │   ├── Post.js                # Post schema with relationships
│   │   └── Comment.js             # Comment schema
│   ├── routes/
│   │   ├── authRoutes.js          # Auth endpoints + validation
│   │   ├── postRoutes.js          # Post endpoints
│   │   ├── commentRoutes.js       # Comment endpoints
│   │   └── likeRoutes.js          # Like endpoints
│   └── app.js                     # Express app setup
├── uploads/                       # Uploaded images stored here
├── .env                           # Environment variables
├── .gitignore
├── package.json
└── server.js                      # Entry point
```

---

## 🔌 API Endpoints

### Auth Routes
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login user |
| POST | `/api/auth/refresh` | ❌ | Get new access token via cookie |
| POST | `/api/auth/logout` | ❌ | Clear refresh token cookie |
| GET | `/api/auth/me` | ✅ | Get current user profile |
| PUT | `/api/auth/profile` | ✅ | Update name and bio |

### Post Routes
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/posts` | ✅ | Create post (with image) |
| GET | `/api/posts` | ❌ | Get all posts (paginated) |
| GET | `/api/posts/:id` | ❌ | Get single post |
| PUT | `/api/posts/:id` | ✅ | Update post (author/admin) |
| DELETE | `/api/posts/:id` | ✅ | Delete post (author/admin) |

### Comment Routes
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/posts/:id/comments` | ✅ | Add comment |
| GET | `/api/posts/:id/comments` | ❌ | Get all comments |
| DELETE | `/api/comments/:id` | ✅ | Delete comment (author/admin) |

### Like Routes
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/posts/:id/like` | ✅ | Like a post |
| DELETE | `/api/posts/:id/like` | ✅ | Unlike a post |

---

## 📖 Query Parameters for GET /api/posts

| Parameter | Type | Example | Description |
|---|---|---|---|
| page | Number | `?page=2` | Page number (default 1) |
| limit | Number | `?limit=5` | Results per page (default 10) |
| search | String | `?search=react` | Search title and content |
| category | String | `?category=Technology` | Filter by category |
| author | String | `?author=USER_ID` | Filter by author |
| sortBy | String | `?sortBy=views` | Sort field (default createdAt) |
| order | String | `?order=asc` | asc or desc (default desc) |

**Example:**
```
GET /api/posts?page=1&limit=5&search=react&category=Technology
```

---

## ⚙️ Run Locally

### Prerequisites
- Node.js v18 or higher
- MongoDB Atlas account

### Steps
```bash
git clone https://github.com/ratnachaplot/blog-api.git
cd blog-api
npm install
mkdir uploads
```

Create `.env` file:
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=yourAccessTokenSecret
JWT_REFRESH_SECRET=yourRefreshTokenSecret
PORT=5000
NODE_ENV=development
```

```bash
npm run dev
# API runs on http://localhost:3000
```

---

## 🔐 Authentication Flow

```
1. POST /api/auth/login
   → Response: { accessToken: "eyJ..." }
   → Cookie set: refreshToken (httpOnly, 7 days)

2. Use accessToken in every protected request:
   Header: Authorization: Bearer eyJ...

3. After 15 minutes accessToken expires:
   POST /api/auth/refresh
   → Cookie sent automatically by browser
   → Response: { accessToken: "eyJ..." (new) }

4. POST /api/auth/logout
   → refreshToken cookie cleared
   → User must login again after 7 days
```

---

## 🧠 Key Implementation Details

### Why Two Tokens?
Access tokens are short-lived (15 min) to limit damage if stolen. Refresh tokens are long-lived (7 days) but stored in httpOnly cookies which JavaScript cannot read — safe from XSS attacks.

### Why Different Secrets?
`JWT_SECRET` and `JWT_REFRESH_SECRET` are different so a refresh token cannot be used as an access token on protected routes. Each token is only valid for its intended purpose.

### Why httpOnly Cookie for Refresh Token?
localStorage can be read by any JavaScript including malicious scripts injected via XSS attacks. httpOnly cookies cannot be accessed by JavaScript at all — only the browser sends them automatically with requests.

### Role Based Access
Users have a `role` field — either `user` or `admin`. The `adminMiddleware` checks this after `authMiddleware` runs. Admins can delete any post or comment. Regular users can only delete their own.

### Pagination Logic
```javascript
const skip = (page - 1) * limit
// page 1 → skip 0  → docs 1-10
// page 2 → skip 10 → docs 11-20
// page 3 → skip 20 → docs 21-30
```

### File Upload
Multer stores images in the `uploads/` folder with unique timestamped filenames. Only jpeg, png, webp, and gif files are allowed. Max size is 5MB. Files are served as static assets at `/uploads/filename.jpg`.

---

## 🐛 Challenges Faced & Solved

| Challenge | Solution |
|---|---|
| Access token too long lived (security risk) | Switched to 15 min access token + 7 day refresh token |
| Refresh token could be stolen from localStorage | Stored in httpOnly cookie — JavaScript cannot read it |
| Both tokens using same secret (security gap) | Created separate JWT_REFRESH_SECRET |
| uploads folder not in git (Multer crashes) | Added uploads/.gitkeep to track empty folder |
| CORS blocking cookies cross-origin | Added credentials: true in CORS config |

---

## 🚀 Deployment

Deployed on Render as a Web Service:

```
Build Command: npm install
Start Command: node server.js
```

Environment variables set on Render:
```
MONGO_URI
JWT_SECRET
JWT_REFRESH_SECRET
NODE_ENV=production
```

---

## 🔮 Future Improvements

- [ ] Email verification on register (Nodemailer)
- [ ] Forgot password / reset via email
- [ ] Rate limiting (express-rate-limit)
- [ ] Account lockout after 5 failed logins
- [ ] Token blacklist for immediate logout
- [ ] Follow / unfollow users
- [ ] Bookmark posts



