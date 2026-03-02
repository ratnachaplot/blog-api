const express = require('express')
const router  = express.Router()
const {
  addComment, getComments, deleteComment
} = require('../controllers/commentController')
const protect = require('../middleware/authMiddleware')

router.post('/:id/comments',   protect, addComment)
router.get('/:id/comments',            getComments)

// Separate route for delete — uses comment ID not post ID
router.delete('/comments/:id', protect, deleteComment)

module.exports = router