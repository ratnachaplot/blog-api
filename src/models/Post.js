const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [5,   'Title must be at least 5 characters'],
    maxlength: [150, 'Title cannot exceed 150 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    minlength: [20, 'Content must be at least 20 characters']
  },
  summary: {
    type: String,
    default: '',
    maxlength: [300, 'Summary cannot exceed 300 characters']
  },
  thumbnail: {
    type: String,
    default: ''  // stores filename of uploaded image
  },
  category: {
    type: String,
    enum: ['Technology', 'Health', 'Finance', 'Education',
           'Travel', 'Food', 'Sports', 'Other'],
    default: 'Other'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  // Reference to User who created the post
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Array of User IDs who liked this post
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Virtual field for like count
  likesCount: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: true
  }
}, { timestamps: true })

const Post = mongoose.model('Post', postSchema)
module.exports = Post