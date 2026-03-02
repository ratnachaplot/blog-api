const express = require('express')
const router  = express.Router()
const { likePost, unlikePost } = require('../controllers/likeController')
const protect = require('../middleware/authMiddleware')

router.post('/:id/like',   protect, likePost)
router.delete('/:id/like', protect, unlikePost)

module.exports = router