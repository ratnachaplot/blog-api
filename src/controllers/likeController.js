const Post = require('../models/Post')

// ─────────────────────────────────────
// LIKE POST
// POST /api/posts/:id/like
// ─────────────────────────────────────
const likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      })
    }

    // Check if already liked
    const alreadyLiked = post.likes.includes(req.user._id)
    if (alreadyLiked) {
      return res.status(400).json({
        success: false,
        message: 'You already liked this post'
      })
    }

    // Add user to likes array
    post.likes.push(req.user._id)
    post.likesCount = post.likes.length
    await post.save()

    res.status(200).json({
      success: true,
      message: 'Post liked successfully',
      likesCount: post.likesCount
    })
  } catch (error) {
    next(error)
  }
}

// ─────────────────────────────────────
// UNLIKE POST
// DELETE /api/posts/:id/like
// ─────────────────────────────────────
const unlikePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      })
    }

    // Check if not liked yet
    const alreadyLiked = post.likes.includes(req.user._id)
    if (!alreadyLiked) {
      return res.status(400).json({
        success: false,
        message: 'You have not liked this post'
      })
    }

    // Remove user from likes array
    post.likes = post.likes.filter(
      id => id.toString() !== req.user._id.toString()
    )
    post.likesCount = post.likes.length
    await post.save()

    res.status(200).json({
      success: true,
      message: 'Post unliked successfully',
      likesCount: post.likesCount
    })
  } catch (error) {
    next(error)
  }
}

module.exports = { likePost, unlikePost }