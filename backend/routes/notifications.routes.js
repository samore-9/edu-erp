// routes/notifications.routes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createNotification, getMyNotifications, markRead, markAllRead,
  getAllNotifications, updateNotification, deleteNotification,
} = require('../controllers/notificationController');

router.get('/all',         protect, authorize('teacher'), getAllNotifications);
router.put('/read-all',    protect, markAllRead);

router.route('/')
  .get(protect, getMyNotifications)
  .post(protect, authorize('teacher'), createNotification);

router.put('/:id/read',    protect, markRead);
router.route('/:id')
  .put(protect, authorize('teacher'), updateNotification)
  .delete(protect, authorize('teacher'), deleteNotification);

module.exports = router;
