const express = require('express');
const reminderService = require('../services/reminderService');
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// Get reminder service status (Admin only)
router.get('/status', authMiddleware, authorizeRoles('admin', 'super_admin'), (req, res) => {
  try {
    const status = reminderService.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Manually trigger due date reminders (Admin only)
router.post('/trigger/due-date', authMiddleware, authorizeRoles('admin', 'super_admin'), async (req, res) => {
  try {
    const remindersSent = await reminderService.triggerDueDateReminders();
    res.json({
      message: 'Due date reminders triggered successfully',
      remindersSent
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Manually trigger overdue notifications (Admin only)
router.post('/trigger/overdue', authMiddleware, authorizeRoles('admin', 'super_admin'), async (req, res) => {
  try {
    const notificationsSent = await reminderService.triggerOverdueNotifications();
    res.json({
      message: 'Overdue notifications triggered successfully',
      notificationsSent
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Manually trigger expired reservation cleanup (Admin only)
router.post('/trigger/cleanup', authMiddleware, authorizeRoles('admin', 'super_admin'), async (req, res) => {
  try {
    const cleanedCount = await reminderService.triggerExpiredReservationCleanup();
    res.json({
      message: 'Expired reservation cleanup triggered successfully',
      cleanedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start the reminder scheduler (Admin only)
router.post('/start', authMiddleware, authorizeRoles('admin', 'super_admin'), (req, res) => {
  try {
    reminderService.startScheduler();
    res.json({ message: 'Reminder scheduler started successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Stop the reminder scheduler (Admin only)
router.post('/stop', authMiddleware, authorizeRoles('admin', 'super_admin'), (req, res) => {
  try {
    reminderService.stopScheduler();
    res.json({ message: 'Reminder scheduler stopped successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
