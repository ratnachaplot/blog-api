const express = require('express')
const router  = express.Router()
const { body } = require('express-validator')
const {
  createPost, getAllPosts,
  getPostById, updatePost, deletePost
} = require('../controllers/postController')
const protect = require('../middleware/authMiddleware')
const upload  = require('../middleware/uploadMiddleware')

const postValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 5 }).withMessage('Title must be at least 5 characters'),
  body('content')
    .notEmpty().withMessage('Content is required')
    .isLength({ min: 20 }).withMessage('Content must be at least 20 characters')
]

// upload.single('thumbnail') — handles one file with field name "thumbnail"
router.post('/',    protect, upload.single('thumbnail'), postValidation, createPost)
router.get('/',     getAllPosts)
router.get('/:id',  getPostById)
router.put('/:id',  protect, upload.single('thumbnail'), updatePost)
router.delete('/:id', protect, deletePost)

module.exports = router