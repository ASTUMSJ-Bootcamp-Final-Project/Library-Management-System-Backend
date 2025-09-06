# 📚 Library Management System - Setup Guide

## 🚀 Enhanced Features

This system now includes:
- **📧 Automated Email Notifications** using Nodemailer
- **🖼️ Cloudinary Image Handling** for book cover uploads
- **⏰ Scheduled Reminder System** for due dates and overdue books

## 📝 Environment Configuration

Create a `.env` file in the backend root directory with the following variables:

```env
# Application Configuration
APP_NAME=Library Management System
PORT=3000

# Database Configuration
MONGO_URI=mongodb://localhost:27017/library-management

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Email Configuration (for automated notifications)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password-here

# Cloudinary Configuration (for book cover image uploads)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Development/Production Environment
NODE_ENV=development
```

## 📧 Email Service Setup

### Gmail Setup (Recommended)
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → App passwords
   - Generate a password for "Mail"
   - Use this password in `EMAIL_PASS`

### Other Email Services
- **Outlook**: Use `outlook` as `EMAIL_SERVICE`
- **Yahoo**: Use `yahoo` as `EMAIL_SERVICE`
- **Custom SMTP**: Modify the email service configuration in `src/services/emailService.js`

### Email Features
- ✅ **Reservation Confirmation**: Sent when a book is reserved
- ✅ **Borrow Confirmation**: Sent when a book is collected
- ✅ **Return Confirmation**: Sent when a book is returned
- ✅ **Reservation Cancellation**: Sent when reservation expires
- ✅ **Due Date Reminders**: Sent 1-3 days before due date
- ✅ **Overdue Notifications**: Sent for overdue books

## 🖼️ Cloudinary Setup

### Account Creation
1. Sign up at [Cloudinary](https://cloudinary.com)
2. Get your credentials from the Dashboard:
   - Cloud Name
   - API Key
   - API Secret

### Image Features
- ✅ **Automatic WebP Conversion** for better compression
- ✅ **Responsive Image URLs** (thumbnail, small, medium, large)
- ✅ **Automatic Optimization** with quality settings
- ✅ **Secure Storage** with public ID management
- ✅ **Fallback Support** for local file storage

## 📦 Installation & Setup

```bash
# Install dependencies
npm install

# Install new dependencies for email and image handling
npm install nodemailer cloudinary multer-storage-cloudinary node-cron

# Set up environment variables
cp .env.example .env
# Edit .env with your actual credentials

# Start the development server
npm run dev
```

## 🔧 Scheduled Tasks

The system automatically runs these scheduled tasks:

| Task | Schedule | Description |
|------|----------|-------------|
| Due Date Reminders | Daily at 9:00 AM UTC | Send reminders for books due in 1-3 days |
| Overdue Notifications | Daily at 10:00 AM UTC | Send alerts for overdue books |
| Expired Reservation Cleanup | Every hour | Clean up expired reservations |

### Manual Task Triggers (Admin Only)

```bash
# Trigger due date reminders
POST /api/reminders/trigger/due-date

# Trigger overdue notifications
POST /api/reminders/trigger/overdue

# Trigger expired reservation cleanup
POST /api/reminders/trigger/cleanup

# Check scheduler status
GET /api/reminders/status
```

## 📚 New API Endpoints

### Book Management with Images
```bash
# Add book with cover image
POST /api/books
Content-Type: multipart/form-data
Fields: title, author, isbn, category, publicationYear, totalCopies, description, coverImage

# Update book with new cover image
PUT /api/books/:id
Content-Type: multipart/form-data
```

### Reminder Management (Admin Only)
```bash
GET /api/reminders/status
POST /api/reminders/trigger/due-date
POST /api/reminders/trigger/overdue
POST /api/reminders/trigger/cleanup
POST /api/reminders/start
POST /api/reminders/stop
```

## 🔍 Book Model Updates

The Book model now includes enhanced image handling:

```javascript
{
  title: String,
  author: String,
  isbn: String,
  category: String,
  publicationYear: Number,
  totalCopies: Number,
  availableCopies: Number,
  description: String,
  
  // Cloudinary image data
  coverImage: {
    url: String,           // Main image URL
    publicId: String,      // Cloudinary public ID
    thumbnailUrl: String,  // Thumbnail version
    responsiveUrls: {
      thumbnail: String,   // 150x225
      small: String,       // 300x450
      medium: String,      // 500x750
      large: String        // 800x1200
    }
  },
  
  // Legacy support
  legacyCoverImage: String,
  
  createdAt: Date,
  updatedAt: Date
}
```

## 🚨 Troubleshooting

### Email Issues
- **Gmail not working**: Ensure 2FA is enabled and use App Password
- **No emails sent**: Check console for configuration warnings
- **Wrong timezone**: Reminders use UTC time by default

### Image Upload Issues
- **Upload fails**: Check Cloudinary credentials
- **Large files**: Images are automatically resized and compressed
- **Fallback mode**: System works without Cloudinary (uses local storage)

### Scheduler Issues
- **Tasks not running**: Check if scheduler started successfully
- **Wrong timing**: Verify system timezone settings
- **Manual testing**: Use trigger endpoints for testing

## 📱 Integration Notes

### Frontend Integration
- **Image URLs**: Use `book.coverImage.responsiveUrls` for different sizes
- **Error Handling**: Check for `uploadStatus` in book creation/update responses
- **Email Status**: Email sending is non-blocking (won't affect user experience)

### Database Migration
- Existing books will continue to work with `legacyCoverImage`
- New books will use the enhanced `coverImage` structure
- No manual migration required

## 🔐 Security Notes

- **Email credentials**: Never commit `.env` file to version control
- **Cloudinary**: Use environment-specific cloud names for different environments
- **Image validation**: Only image files are accepted for upload
- **Rate limiting**: Consider adding rate limiting for image uploads in production

## 📈 Performance Optimizations

- **WebP format**: Automatically converts images to WebP for better compression
- **Lazy loading**: Use responsive URLs for progressive loading
- **CDN delivery**: Cloudinary provides global CDN for fast image delivery
- **Background tasks**: Email sending and image processing are non-blocking

---

💡 **Pro Tip**: Test email notifications with a personal email address before production deployment!
