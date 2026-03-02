const multer = require('multer')
const path   = require('path')

// Where to store files and what to name them
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    // unique filename: timestamp + original name
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s/g, '-')}`
    cb(null, uniqueName)
  }
})

// Only allow image files
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed (jpeg, png, webp, gif)'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
})

module.exports = upload