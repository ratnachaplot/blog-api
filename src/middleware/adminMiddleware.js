// Runs AFTER protect middleware
// Checks if logged in user is admin
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next()
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admins only.'
    })
  }
}

module.exports = adminOnly