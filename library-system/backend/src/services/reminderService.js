const cron = require('node-cron');
const Borrow = require('../models/Borrow');
const User = require('../models/User');
const Book = require('../models/Book');
const emailService = require('./emailService');
const { updateOverdueBooks } = require('../utils/dateUtils');

class ReminderService {
  constructor() {
    this.isSchedulerActive = false;
    this.scheduledTasks = [];
  }

  // Start all scheduled tasks
  startScheduler() {
    if (this.isSchedulerActive) {
      console.log('Reminder scheduler is already active');
      return;
    }

    // Schedule due date reminders (daily at 9:00 AM)
    const dueDateReminderTask = cron.schedule('0 9 * * *', () => {
      this.sendDueDateReminders();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Schedule overdue notifications (daily at 10:00 AM)
    const overdueNotificationTask = cron.schedule('0 10 * * *', () => {
      this.sendOverdueNotifications();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Schedule expired reservation cleanup (every hour)
    const expiredReservationTask = cron.schedule('0 * * * *', () => {
      this.cleanupExpiredReservations();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Start all tasks
    dueDateReminderTask.start();
    overdueNotificationTask.start();
    expiredReservationTask.start();

    this.scheduledTasks = [dueDateReminderTask, overdueNotificationTask, expiredReservationTask];
    this.isSchedulerActive = true;

    console.log('📅 Reminder scheduler started successfully');
    console.log('- Due date reminders: Daily at 9:00 AM UTC');
    console.log('- Overdue notifications: Daily at 10:00 AM UTC');
    console.log('- Expired reservation cleanup: Every hour');
  }

  // Stop all scheduled tasks
  stopScheduler() {
    if (!this.isSchedulerActive) {
      console.log('Reminder scheduler is not active');
      return;
    }

    this.scheduledTasks.forEach(task => {
      task.stop();
    });

    this.scheduledTasks = [];
    this.isSchedulerActive = false;

    console.log('📅 Reminder scheduler stopped');
  }

  // Send due date reminders for books due in 1-3 days
  async sendDueDateReminders() {
    try {
      console.log('📬 Sending due date reminders...');

      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      // Find books due in the next 3 days
      const upcomingDueBooks = await Borrow.find({
        status: 'borrowed',
        dueDate: {
          $gte: now,
          $lte: threeDaysFromNow
        }
      })
      .populate('user', 'username email')
      .populate('book', 'title');

      let remindersSent = 0;

      for (const borrow of upcomingDueBooks) {
        if (!borrow.user || !borrow.user.email || !borrow.book) {
          continue;
        }

        const daysRemaining = Math.ceil((new Date(borrow.dueDate) - now) / (1000 * 60 * 60 * 24));
        
        // Only send reminders for 1-3 days remaining
        if (daysRemaining >= 1 && daysRemaining <= 3) {
          try {
            await emailService.sendDueDateReminder(
              borrow.user.email,
              borrow.user.username,
              borrow.book.title,
              borrow.dueDate,
              daysRemaining
            );
            remindersSent++;
          } catch (emailError) {
            console.error(`Failed to send reminder to ${borrow.user.email}:`, emailError.message);
          }
        }
      }

      console.log(`📬 Sent ${remindersSent} due date reminders`);
      return remindersSent;
    } catch (error) {
      console.error('Error sending due date reminders:', error);
      return 0;
    }
  }

  // Send overdue notifications for books that are overdue
  async sendOverdueNotifications() {
    try {
      console.log('🚨 Sending overdue notifications...');

      // Update overdue status first
      await updateOverdueBooks(Borrow);

      const now = new Date();

      // Find overdue books
      const overdueBooks = await Borrow.find({
        status: 'overdue',
        dueDate: { $lt: now }
      })
      .populate('user', 'username email')
      .populate('book', 'title');

      let notificationsSent = 0;

      for (const borrow of overdueBooks) {
        if (!borrow.user || !borrow.user.email || !borrow.book) {
          continue;
        }

        const daysOverdue = Math.ceil((now - new Date(borrow.dueDate)) / (1000 * 60 * 60 * 24));
        
        try {
          await emailService.sendOverdueNotification(
            borrow.user.email,
            borrow.user.username,
            borrow.book.title,
            borrow.dueDate,
            daysOverdue
          );
          notificationsSent++;
        } catch (emailError) {
          console.error(`Failed to send overdue notification to ${borrow.user.email}:`, emailError.message);
        }
      }

      console.log(`🚨 Sent ${notificationsSent} overdue notifications`);
      return notificationsSent;
    } catch (error) {
      console.error('Error sending overdue notifications:', error);
      return 0;
    }
  }

  // Clean up expired reservations
  async cleanupExpiredReservations() {
    try {
      console.log('🧹 Cleaning up expired reservations...');

      const now = new Date();
      
      // Find expired reservations
      const expiredReservations = await Borrow.find({
        status: 'reserved',
        reservationExpiry: { $lt: now }
      })
      .populate('user', 'username email')
      .populate('book', 'title');

      let cleanedCount = 0;

      for (const reservation of expiredReservations) {
        try {
          // Restore available copies first
          const book = await Book.findById(reservation.book._id);
          if (book) {
            book.availableCopies += 1;
            await book.save();
          }

          // Send cancellation email
          if (reservation.user && reservation.user.email && reservation.book) {
            try {
              await emailService.sendReservationCancellation(
                reservation.user.email,
                reservation.user.username,
                reservation.book.title,
                'Reservation expired'
              );
            } catch (emailError) {
              console.error(`Failed to send cancellation email to ${reservation.user.email}:`, emailError.message);
            }
          }

          cleanedCount++;
        } catch (error) {
          console.error(`Failed to cleanup reservation ${reservation._id}:`, error.message);
        }
      }

      // Delete all expired reservations completely
      const deleteResult = await Borrow.deleteMany({
        status: 'reserved',
        reservationExpiry: { $lt: now }
      });

      console.log(`🧹 Cleaned up and removed ${deleteResult.deletedCount} expired reservations`);
      return deleteResult.deletedCount;
    } catch (error) {
      console.error('Error cleaning up expired reservations:', error);
      return 0;
    }
  }

  // Manual trigger methods for testing
  async triggerDueDateReminders() {
    return await this.sendDueDateReminders();
  }

  async triggerOverdueNotifications() {
    return await this.sendOverdueNotifications();
  }

  async triggerExpiredReservationCleanup() {
    return await this.cleanupExpiredReservations();
  }

  // Get scheduler status
  getStatus() {
    return {
      isActive: this.isSchedulerActive,
      tasksCount: this.scheduledTasks.length,
      tasks: [
        {
          name: 'Due Date Reminders',
          schedule: 'Daily at 9:00 AM UTC',
          description: 'Send reminders for books due in 1-3 days'
        },
        {
          name: 'Overdue Notifications',
          schedule: 'Daily at 10:00 AM UTC',
          description: 'Send alerts for overdue books'
        },
        {
          name: 'Expired Reservation Cleanup',
          schedule: 'Every hour',
          description: 'Clean up expired reservations and restore book availability'
        }
      ]
    };
  }
}

module.exports = new ReminderService();
