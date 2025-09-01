const multer = require('multer');
const cloudinaryService = require('../services/cloudinaryService');
const fs = require('fs').promises;
const path = require('path');

// Configure multer for temporary file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../temp')); // Temporary directory
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Middleware to handle Cloudinary upload
const uploadToCloudinary = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(); // No file uploaded, continue
    }

    if (!cloudinaryService.isConfigured()) {
      console.warn('Cloudinary not configured, skipping upload');
      // Clean up temp file
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to delete temp file:', unlinkError);
      }
      return next();
    }

    // Upload to Cloudinary
    const uploadResult = await cloudinaryService.uploadImage(req.file.path, {
      folder: 'library-books',
      public_id: `book-${Date.now()}`,
    });

    if (uploadResult.success) {
      // Generate responsive URLs
      const responsiveUrls = cloudinaryService.generateResponsiveUrls(uploadResult.publicId);
      
      // Generate thumbnail
      const thumbnailResult = await cloudinaryService.generateThumbnail(uploadResult.publicId);
      
      // Add Cloudinary data to request
      req.cloudinaryResult = {
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        thumbnailUrl: thumbnailResult.success ? thumbnailResult.thumbnailUrl : uploadResult.url,
        responsiveUrls: responsiveUrls,
        originalFile: req.file
      };
      
      console.log('Successfully uploaded to Cloudinary:', uploadResult.publicId);
    } else {
      console.error('Cloudinary upload failed:', uploadResult.error);
      req.uploadError = uploadResult.error;
    }

    // Clean up temporary file
    try {
      await fs.unlink(req.file.path);
    } catch (unlinkError) {
      console.error('Failed to delete temp file:', unlinkError);
    }

    next();
  } catch (error) {
    console.error('Cloudinary upload middleware error:', error);
    
    // Clean up temp file on error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to delete temp file on error:', unlinkError);
      }
    }
    
    req.uploadError = error.message;
    next();
  }
};

// Create temp directory if it doesn't exist
const ensureTempDir = async () => {
  const tempDir = path.join(__dirname, '../../temp');
  try {
    await fs.access(tempDir);
  } catch (error) {
    // Directory doesn't exist, create it
    try {
      await fs.mkdir(tempDir, { recursive: true });
      console.log('Created temp directory for uploads');
    } catch (mkdirError) {
      console.error('Failed to create temp directory:', mkdirError);
    }
  }
};

// Initialize temp directory
ensureTempDir();

// Export the combined middleware
const uploadBookCover = [
  upload.single('coverImage'),
  uploadToCloudinary
];

module.exports = {
  uploadBookCover,
  uploadToCloudinary,
  upload
};
