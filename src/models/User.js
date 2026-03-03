const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name: {
    type:      String,
    required:  [true, 'Name is required'],
    trim:      true,
    minlength: [2,  'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type:      String,
    required:  [true, 'Email is required'],
    unique:    true,
    lowercase: true,
    trim:      true,
    match:     [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type:      String,
    required:  [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select:    false  // never return password in queries
  },
  role: {
    type:    String,
    enum:    ['user', 'admin'],
    default: 'user'
  },
  avatar: {
    type:    String,
    default: ''
  },
  bio: {
    type:      String,
    default:   '',
    maxlength: [200, 'Bio cannot exceed 200 characters']
  },

  // Account lockout fields
  loginAttempts: {
    type:    Number,
    default: 0
  },
  lockUntil: {
    type:    Date,
    default: null
  }

}, { timestamps: true })

const User = mongoose.model('User', userSchema)
module.exports = User