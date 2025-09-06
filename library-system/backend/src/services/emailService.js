const nodemailer = require('nodemailer');
const { ENV } = require('../config/env');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    if (!ENV.EMAIL_SERVICE || !ENV.EMAIL_USER || !ENV.EMAIL_PASS) {
      console.warn('Email configuration missing. Email notifications will be disabled.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      service: ENV.EMAIL_SERVICE, // e.g., 'gmail', 'yahoo', 'outlook'
      auth: {
        user: ENV.EMAIL_USER,
        pass: ENV.EMAIL_PASS, // Use app password for Gmail
      },
    });

    // Verify connection configuration
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('Email transporter verification failed:', error);
      } else {
        console.log('Email service ready to send messages');
      }
    });
  }

  async sendEmail(to, subject, htmlContent, textContent = null) {
    if (!this.transporter) {
      console.warn('Email transporter not configured. Skipping email send.');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: `"${ENV.APP_NAME}" <${ENV.EMAIL_USER}>`,
        to,
        subject,
        html: htmlContent,
        text: textContent || this.stripHtml(htmlContent),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send email:', error);
      return { success: false, error: error.message };
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  // Email Templates
  generateBookReservationEmail(userEmail, userName, bookTitle, reservationExpiry) {
    const subject = `📚 Book Reservation Confirmed - ${bookTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #4f46e5; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">📚 ${ENV.APP_NAME}</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Book Reservation Confirmed!</h2>
          <p style="color: #666; font-size: 16px;">Hello <strong>${userName}</strong>,</p>
          <p style="color: #666; font-size: 16px;">Your reservation for the following book has been confirmed:</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #4f46e5; margin: 0 0 10px 0;">📖 ${bookTitle}</h3>
            <p style="color: #666; margin: 0;"><strong>Reservation Expires:</strong> ${new Date(reservationExpiry).toLocaleString()}</p>
          </div>
          
          <div style="background-color: #fef3cd; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #92400e; margin: 0; font-weight: bold;">⚠️ Important: Please collect your book before the reservation expires!</p>
          </div>
          
          <p style="color: #666; font-size: 16px;">Thank you for using our library management system!</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #999; font-size: 14px;">Best regards,<br>${ENV.APP_NAME} Team</p>
          </div>
        </div>
      </div>
    `;
    return { subject, html };
  }

  generateBookBorrowEmail(userEmail, userName, bookTitle, dueDate) {
    const subject = `📚 Book Borrowed Successfully - ${bookTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #059669; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">📚 ${ENV.APP_NAME}</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Book Borrowed Successfully! ✅</h2>
          <p style="color: #666; font-size: 16px;">Hello <strong>${userName}</strong>,</p>
          <p style="color: #666; font-size: 16px;">You have successfully borrowed the following book:</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #059669; margin: 0 0 10px 0;">📖 ${bookTitle}</h3>
            <p style="color: #666; margin: 0;"><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
          </div>
          
          <div style="background-color: #ecfdf5; border: 1px solid #10b981; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #065f46; margin: 0; font-weight: bold;">💡 Remember: Please return the book by the due date to avoid overdue charges!</p>
          </div>
          
          <p style="color: #666; font-size: 16px;">Enjoy your reading!</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #999; font-size: 14px;">Best regards,<br>${ENV.APP_NAME} Team</p>
          </div>
        </div>
      </div>
    `;
    return { subject, html };
  }

  generateBookReturnEmail(userEmail, userName, bookTitle, returnDate) {
    const subject = `📚 Book Returned Successfully - ${bookTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #7c3aed; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">📚 ${ENV.APP_NAME}</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Book Returned Successfully! 🎉</h2>
          <p style="color: #666; font-size: 16px;">Hello <strong>${userName}</strong>,</p>
          <p style="color: #666; font-size: 16px;">Thank you for returning the following book:</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #7c3aed; margin: 0 0 10px 0;">📖 ${bookTitle}</h3>
            <p style="color: #666; margin: 0;"><strong>Return Date:</strong> ${new Date(returnDate).toLocaleDateString()}</p>
          </div>
          
          <div style="background-color: #f0f9ff; border: 1px solid #3b82f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #1e40af; margin: 0; font-weight: bold;">✨ Thank you for being a responsible library member!</p>
          </div>
          
          <p style="color: #666; font-size: 16px;">Feel free to browse our collection for your next read!</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #999; font-size: 14px;">Best regards,<br>${ENV.APP_NAME} Team</p>
          </div>
        </div>
      </div>
    `;
    return { subject, html };
  }

  generateReservationCancelledEmail(userEmail, userName, bookTitle, reason = 'Reservation expired') {
    const subject = `📚 Book Reservation Cancelled - ${bookTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #dc2626; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">📚 ${ENV.APP_NAME}</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Reservation Cancelled</h2>
          <p style="color: #666; font-size: 16px;">Hello <strong>${userName}</strong>,</p>
          <p style="color: #666; font-size: 16px;">Your reservation for the following book has been cancelled:</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #dc2626; margin: 0 0 10px 0;">📖 ${bookTitle}</h3>
            <p style="color: #666; margin: 0;"><strong>Reason:</strong> ${reason}</p>
          </div>
          
          <div style="background-color: #fef2f2; border: 1px solid #f87171; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #991b1b; margin: 0; font-weight: bold;">ℹ️ You can make a new reservation if the book is still available.</p>
          </div>
          
          <p style="color: #666; font-size: 16px;">We apologize for any inconvenience.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #999; font-size: 14px;">Best regards,<br>${ENV.APP_NAME} Team</p>
          </div>
        </div>
      </div>
    `;
    return { subject, html };
  }

  generateDueDateReminderEmail(userEmail, userName, bookTitle, dueDate, daysRemaining) {
    const subject = `📚 Reminder: Book Due Soon - ${bookTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #f59e0b; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">📚 ${ENV.APP_NAME}</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">📅 Due Date Reminder</h2>
          <p style="color: #666; font-size: 16px;">Hello <strong>${userName}</strong>,</p>
          <p style="color: #666; font-size: 16px;">This is a friendly reminder that your borrowed book is due soon:</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #f59e0b; margin: 0 0 10px 0;">📖 ${bookTitle}</h3>
            <p style="color: #666; margin: 0;"><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
            <p style="color: #666; margin: 5px 0 0 0;"><strong>Days Remaining:</strong> ${daysRemaining} day(s)</p>
          </div>
          
          <div style="background-color: #fef3cd; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #92400e; margin: 0; font-weight: bold;">⏰ Please return the book by the due date to avoid late fees!</p>
          </div>
          
          <p style="color: #666; font-size: 16px;">Thank you for your attention to this matter.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #999; font-size: 14px;">Best regards,<br>${ENV.APP_NAME} Team</p>
          </div>
        </div>
      </div>
    `;
    return { subject, html };
  }

  generateOverdueNotificationEmail(userEmail, userName, bookTitle, dueDate, daysOverdue) {
    const subject = `🚨 OVERDUE: Book Return Required - ${bookTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #dc2626; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">📚 ${ENV.APP_NAME}</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">🚨 OVERDUE BOOK NOTICE</h2>
          <p style="color: #666; font-size: 16px;">Hello <strong>${userName}</strong>,</p>
          <p style="color: #666; font-size: 16px;">The following book is now overdue and must be returned immediately:</p>
          
          <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #dc2626;">
            <h3 style="color: #dc2626; margin: 0 0 10px 0;">📖 ${bookTitle}</h3>
            <p style="color: #666; margin: 0;"><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
            <p style="color: #dc2626; margin: 5px 0 0 0; font-weight: bold;"><strong>Days Overdue:</strong> ${daysOverdue} day(s)</p>
          </div>
          
          <div style="background-color: #fef2f2; border: 1px solid #f87171; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #991b1b; margin: 0; font-weight: bold;">⚠️ URGENT: Late fees may apply. Please return this book immediately to avoid additional charges and restore your borrowing privileges.</p>
          </div>
          
          <p style="color: #666; font-size: 16px;">Please contact the library if you need assistance or have any questions.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #999; font-size: 14px;">Best regards,<br>${ENV.APP_NAME} Team</p>
          </div>
        </div>
      </div>
    `;
    return { subject, html };
  }

  // Convenience methods for sending specific types of emails
  async sendReservationConfirmation(userEmail, userName, bookTitle, reservationExpiry) {
    const { subject, html } = this.generateBookReservationEmail(userEmail, userName, bookTitle, reservationExpiry);
    return await this.sendEmail(userEmail, subject, html);
  }

  async sendBorrowConfirmation(userEmail, userName, bookTitle, dueDate) {
    const { subject, html } = this.generateBookBorrowEmail(userEmail, userName, bookTitle, dueDate);
    return await this.sendEmail(userEmail, subject, html);
  }

  async sendReturnConfirmation(userEmail, userName, bookTitle, returnDate) {
    const { subject, html } = this.generateBookReturnEmail(userEmail, userName, bookTitle, returnDate);
    return await this.sendEmail(userEmail, subject, html);
  }

  async sendReservationCancellation(userEmail, userName, bookTitle, reason) {
    const { subject, html } = this.generateReservationCancelledEmail(userEmail, userName, bookTitle, reason);
    return await this.sendEmail(userEmail, subject, html);
  }

  async sendDueDateReminder(userEmail, userName, bookTitle, dueDate, daysRemaining) {
    const { subject, html } = this.generateDueDateReminderEmail(userEmail, userName, bookTitle, dueDate, daysRemaining);
    return await this.sendEmail(userEmail, subject, html);
  }

  async sendOverdueNotification(userEmail, userName, bookTitle, dueDate, daysOverdue) {
    const { subject, html } = this.generateOverdueNotificationEmail(userEmail, userName, bookTitle, dueDate, daysOverdue);
    return await this.sendEmail(userEmail, subject, html);
  }

  generatePaymentApprovalEmail(userEmail, userName, plan, amount) {
    const subject = `✅ Payment Approved - Membership Activated`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #059669; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">📚 ${ENV.APP_NAME}</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">🎉 Payment Approved - Membership Activated!</h2>
          <p style="color: #666; font-size: 16px;">Hello <strong>${userName}</strong>,</p>
          <p style="color: #666; font-size: 16px;">Great news! Your payment has been approved and your library membership is now active.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #059669; margin: 0 0 10px 0;">💳 Payment Details</h3>
            <p style="color: #666; margin: 0;"><strong>Plan:</strong> ${plan}</p>
            <p style="color: #666; margin: 5px 0 0 0;"><strong>Amount:</strong> ${amount} ETB</p>
          </div>
          
          <div style="background-color: #ecfdf5; border: 1px solid #10b981; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #065f46; margin: 0; font-weight: bold;">✨ You can now borrow books from our library! Start exploring our collection.</p>
          </div>
          
          <p style="color: #666; font-size: 16px;">Welcome to the library community!</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #999; font-size: 14px;">Best regards,<br>${ENV.APP_NAME} Team</p>
          </div>
        </div>
      </div>
    `;
    return { subject, html };
  }

  async sendPaymentApproval(userEmail, userName, plan, amount) {
    const { subject, html } = this.generatePaymentApprovalEmail(userEmail, userName, plan, amount);
    return await this.sendEmail(userEmail, subject, html);
  }
}

module.exports = new EmailService();
