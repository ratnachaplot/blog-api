// Global error handler — catches ALL errors from controllers
const errorMiddleware = (err, req, res, next) => {
  console.error('Error:', err.message)

  const statusCode = err.statusCode || 500

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    // Only show stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}

module.exports = errorMiddleware