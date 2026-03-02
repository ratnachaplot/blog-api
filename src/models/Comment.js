const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    minlength: [1,   'Comment cannot be empty'],
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  // Which post this comment belongs to
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  // Who wrote this comment
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true })

const Comment = mongoose.model('Comment', commentSchema)
module.exports = Comment