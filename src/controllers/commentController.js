const Comment = require('../models/Comment')
const Post    = require('../models/Post')

// ─────────────────────────────────────
// ADD COMMENT
// POST /api/posts/:id/comments
// ─────────────────────────────────────
const addComment = async (req, res, next) => {
  try {
    const { content } = req.body

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      })
    }

    // Check post exists
    const post = await Post.findById(req.params.id)
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      })
    }

    const comment = await Comment.create({
      content,
      post:   req.params.id,
      author: req.user._id
    })

    await comment.populate('author', 'name avatar')

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment
    })
  } catch (error) {
    next(error)
  }
}

// ─────────────────────────────────────
// GET COMMENTS FOR A POST
// GET /api/posts/:id/comments
// ─────────────────────────────────────
const getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ post: req.params.id })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: comments.length,
      comments
    })
  } catch (error) {
    next(error)
  }
}

// ─────────────────────────────────────
// DELETE COMMENT
// DELETE /api/comments/:id
// ─────────────────────────────────────
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id)

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      })
    }

    // Only comment author or admin can delete
    if (comment.author.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      })
    }

    await Comment.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    })
  } catch (error) {
    next(error)
  }
}

module.exports = { addComment, getComments, deleteComment }