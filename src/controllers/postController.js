const Post    = require('../models/Post')
const Comment = require('../models/Comment')
const { validationResult } = require('express-validator')

// ─────────────────────────────────────
// CREATE POST
// POST /api/posts
// ─────────────────────────────────────
const createPost = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const { title, content, summary, category, tags } = req.body

    // If image uploaded, save filename
    const thumbnail = req.file ? req.file.filename : ''

    const post = await Post.create({
      title,
      content,
      summary,
      category,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      thumbnail,
      author: req.user._id   // from protect middleware
    })

    // Populate author details in response
    await post.populate('author', 'name email avatar')

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post
    })
  } catch (error) {
    next(error)
  }
}

// ─────────────────────────────────────
// GET ALL POSTS
// GET /api/posts
// Supports: pagination, search, filter by category/author
// ─────────────────────────────────────
const getAllPosts = async (req, res, next) => {
  try {
    const {
      page     = 1,
      limit    = 10,
      search   = '',
      category = '',
      author   = '',
      sortBy   = 'createdAt',
      order    = 'desc'
    } = req.query

    // Build filter object dynamically
    const filter = { isPublished: true }

    // Search in title or content
    if (search) {
      filter.$or = [
        { title:   { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ]
    }

    // Filter by category
    if (category) filter.category = category

    // Filter by author ID
    if (author) filter.author = author

    // Calculate how many docs to skip for pagination
    const skip  = (Number(page) - 1) * Number(limit)
    const total = await Post.countDocuments(filter)

    const posts = await Post.find(filter)
      .populate('author', 'name avatar')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(Number(limit))
      .select('-content')  // exclude full content from list view

    res.status(200).json({
      success: true,
      total,
      page:       Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      count:      posts.length,
      posts
    })
  } catch (error) {
    next(error)
  }
}

// ─────────────────────────────────────
// GET SINGLE POST
// GET /api/posts/:id
// ─────────────────────────────────────
const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name email avatar bio')

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      })
    }

    // Increment view count
    post.views += 1
    await post.save()

    res.status(200).json({
      success: true,
      post
    })
  } catch (error) {
    next(error)
  }
}

// ─────────────────────────────────────
// UPDATE POST
// PUT /api/posts/:id
// ─────────────────────────────────────
const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      })
    }

    // Only author or admin can update
    if (post.author.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post'
      })
    }

    const { title, content, summary, category, tags, isPublished } = req.body
    const thumbnail = req.file ? req.file.filename : post.thumbnail

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      {
        title, content, summary,
        category, thumbnail, isPublished,
        tags: tags ? tags.split(',').map(t => t.trim()) : post.tags
      },
      { new: true, runValidators: true }
    ).populate('author', 'name avatar')

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      post: updatedPost
    })
  } catch (error) {
    next(error)
  }
}

// ─────────────────────────────────────
// DELETE POST
// DELETE /api/posts/:id
// ─────────────────────────────────────
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      })
    }

    // Only author or admin can delete
    if (post.author.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      })
    }

    // Delete post and all its comments
    await Post.findByIdAndDelete(req.params.id)
    await Comment.deleteMany({ post: req.params.id })

    res.status(200).json({
      success: true,
      message: 'Post and all comments deleted successfully'
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost
}