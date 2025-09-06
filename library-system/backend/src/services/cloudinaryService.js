const cloudinary = require('cloudinary');
const { ENV } = require('../config/env');

class CloudinaryService {
  constructor() {
    this.initializeCloudinary();
  }

  initializeCloudinary() {
    if (!ENV.CLOUDINARY_CLOUD_NAME || !ENV.CLOUDINARY_API_KEY || !ENV.CLOUDINARY_API_SECRET) {
      console.warn('Cloudinary configuration missing. Image uploads will be disabled.');
      return;
    }

    cloudinary.config({
      cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
      api_key: ENV.CLOUDINARY_API_KEY,
      api_secret: ENV.CLOUDINARY_API_SECRET,
    });

    console.log('Cloudinary service initialized successfully');
  }

  async uploadImage(filePath, options = {}) {
    try {
      const defaultOptions = {
        folder: 'library-books',
        resource_type: 'image',
        format: 'webp', // Convert to WebP for better compression
        transformation: [
          { width: 800, height: 1200, crop: 'limit' }, // Limit max size
          { quality: 'auto:good' }, // Automatic quality optimization
        ],
        ...options,
      };

      const result = await cloudinary.uploader.upload(filePath, defaultOptions);
      
      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return {
        success: result.result === 'ok',
        result: result.result,
      };
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async generateThumbnail(publicId, options = {}) {
    try {
      const defaultOptions = {
        width: 300,
        height: 450,
        crop: 'fill',
        quality: 'auto:good',
        format: 'webp',
        ...options,
      };

      const thumbnailUrl = cloudinary.url(publicId, defaultOptions);
      
      return {
        success: true,
        thumbnailUrl,
      };
    } catch (error) {
      console.error('Cloudinary thumbnail generation error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get optimized URL for different use cases
  getOptimizedUrl(publicId, options = {}) {
    const defaultOptions = {
      fetch_format: 'auto',
      quality: 'auto:good',
      ...options,
    };

    return cloudinary.url(publicId, defaultOptions);
  }

  // Generate multiple sizes for responsive images
  generateResponsiveUrls(publicId) {
    const sizes = [
      { name: 'thumbnail', width: 150, height: 225 },
      { name: 'small', width: 300, height: 450 },
      { name: 'medium', width: 500, height: 750 },
      { name: 'large', width: 800, height: 1200 },
    ];

    const urls = {};
    sizes.forEach(size => {
      urls[size.name] = cloudinary.url(publicId, {
        width: size.width,
        height: size.height,
        crop: 'fill',
        quality: 'auto:good',
        format: 'auto',
      });
    });

    return urls;
  }

  // Check if Cloudinary is properly configured
  isConfigured() {
    return !!(ENV.CLOUDINARY_CLOUD_NAME && ENV.CLOUDINARY_API_KEY && ENV.CLOUDINARY_API_SECRET);
  }
}

module.exports = new CloudinaryService();
