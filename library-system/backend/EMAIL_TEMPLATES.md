# 📧 Email Notification Templates

This document shows examples of the automated email notifications sent by the Library Management System.

## 📚 Book Reservation Confirmation

**Subject**: 📚 Book Reservation Confirmed - [Book Title]

**Triggers**: When a student successfully reserves a book

**Content**: 
- Confirmation message with book title
- Reservation expiry date and time
- Warning about pickup deadline
- Professional library branding

---

## ✅ Book Borrowing Confirmation  

**Subject**: 📚 Book Borrowed Successfully - [Book Title]

**Triggers**: When admin confirms book collection

**Content**:
- Borrowing confirmation with book title
- Due date clearly displayed
- Reminder about timely return
- Encouraging message about reading

---

## 🎉 Book Return Confirmation

**Subject**: 📚 Book Returned Successfully - [Book Title]

**Triggers**: When a book is successfully returned

**Content**:
- Thank you message for returning book
- Return date confirmation
- Appreciation for being responsible
- Invitation to browse more books

---

## ❌ Reservation Cancellation

**Subject**: 📚 Book Reservation Cancelled - [Book Title]

**Triggers**: When reservation expires or is cancelled

**Content**:
- Cancellation notice with reason
- Information about making new reservations
- Apology for inconvenience
- Contact information for assistance

---

## ⏰ Due Date Reminder

**Subject**: 📚 Reminder: Book Due Soon - [Book Title]

**Triggers**: 1-3 days before due date (daily at 9:00 AM UTC)

**Content**:
- Friendly reminder about upcoming due date
- Number of days remaining
- Warning about late fees
- Clear due date information

---

## 🚨 Overdue Notification

**Subject**: 🚨 OVERDUE: Book Return Required - [Book Title]

**Triggers**: For overdue books (daily at 10:00 AM UTC)

**Content**:
- Urgent overdue notice
- Number of days overdue
- Warning about late fees and privileges
- Contact information for assistance

---

## 🎨 Email Design Features

- **Responsive Design**: Works on desktop and mobile
- **Professional Branding**: Library system colors and logo
- **Clear Typography**: Easy to read fonts and sizing
- **Action-Oriented**: Clear information and next steps
- **Consistent Layout**: Uniform design across all templates
- **Color Coding**: Different colors for different types of notifications
  - 🔵 Blue: Reservations
  - 🟢 Green: Successful actions (borrow, return)
  - 🟡 Yellow: Reminders and warnings
  - 🔴 Red: Urgent notifications and cancellations

## 🔧 Customization

Email templates can be customized by modifying the `src/services/emailService.js` file:

1. **Colors**: Update the style attributes in HTML templates
2. **Content**: Modify the text content and messaging
3. **Logo**: Add your library logo to the email header
4. **Footer**: Customize contact information and links
5. **Formatting**: Adjust spacing, fonts, and layout

## 📱 Testing

Use the manual trigger endpoints to test email notifications:

```bash
# Test due date reminders
POST /api/reminders/trigger/due-date

# Test overdue notifications  
POST /api/reminders/trigger/overdue

# Test expired reservation cleanup
POST /api/reminders/trigger/cleanup
```

## 🌐 Multi-language Support

To add multi-language support:

1. Create language-specific template methods in `emailService.js`
2. Add language detection based on user preferences
3. Store translations in separate JSON files
4. Modify the email generation methods to use translations

## 📊 Analytics

Consider adding email analytics by:

1. Including tracking pixels in email templates
2. Using unique links for click tracking
3. Logging email send success/failure rates
4. Monitoring email open rates and engagement

---

💡 **Pro Tip**: Always test email notifications with real email addresses before deploying to production!
