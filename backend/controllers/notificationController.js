// controllers/notificationController.js — Notifications & announcements
const Notification = require('../models/Notification');
const Student = require('../models/Student');

/**
 * @desc    Create notification / announcement
 * @route   POST /api/notifications
 * @access  Teacher only
 */
exports.createNotification = async (req, res, next) => {
  try {
    const notif = await Notification.create({
      ...req.body,
      createdBy: req.user.id,
    });
    const populated = await notif.populate('createdBy', 'name');
    res.status(201).json({ success: true, data: populated });
  } catch (err) { next(err); }
};

/**
 * @desc    Get notifications for the logged-in user
 * @route   GET /api/notifications
 * @access  Private
 */
exports.getMyNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // Build targeting query
    const query = {
      isActive: true,
      $or: [
        { targetRole: 'all' },
        { targetRole: req.user.role },
      ],
    };

    // For students: also filter by department/semester if set
    if (req.user.role === 'student' && req.user.studentProfile) {
      const student = await Student.findById(req.user.studentProfile);
      if (student) {
        query.$or = [
          { targetRole: 'all', targetDepartment: null },
          { targetRole: 'all', targetDepartment: student.department },
          { targetRole: 'student', targetDepartment: null },
          { targetRole: 'student', targetDepartment: student.department },
        ];
      }
    }

    const total = await Notification.countDocuments(query);
    const notifications = await Notification.find(query)
      .populate('createdBy', 'name role')
      .sort({ pinned: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Mark which ones the user has read
    const notifWithRead = notifications.map(n => {
      const obj = n.toObject();
      obj.isRead = n.readBy.some(r => r.user.toString() === req.user.id.toString());
      obj.readBy = undefined; // don't expose full readBy list to students
      return obj;
    });

    // Count unread
    const unreadCount = notifWithRead.filter(n => !n.isRead).length;

    res.json({
      success: true,
      total,
      unreadCount,
      data: notifWithRead,
    });
  } catch (err) { next(err); }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
exports.markRead = async (req, res, next) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });

    const alreadyRead = notif.readBy.some(r => r.user.toString() === req.user.id.toString());
    if (!alreadyRead) {
      notif.readBy.push({ user: req.user.id });
      await notif.save();
    }

    res.json({ success: true, message: 'Marked as read' });
  } catch (err) { next(err); }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
exports.markAllRead = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ isActive: true });
    const updates = notifications.map(async (n) => {
      const alreadyRead = n.readBy.some(r => r.user.toString() === req.user.id.toString());
      if (!alreadyRead) {
        n.readBy.push({ user: req.user.id });
        return n.save();
      }
    });
    await Promise.all(updates);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) { next(err); }
};

/**
 * @desc    Get all notifications (teacher management view)
 * @route   GET /api/notifications/all
 * @access  Teacher only
 */
exports.getAllNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find()
      .populate('createdBy', 'name')
      .sort({ pinned: -1, createdAt: -1 });
    res.json({ success: true, data: notifications });
  } catch (err) { next(err); }
};

/**
 * @desc    Update notification
 * @route   PUT /api/notifications/:id
 * @access  Teacher only
 */
exports.updateNotification = async (req, res, next) => {
  try {
    const notif = await Notification.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    }).populate('createdBy', 'name');
    if (!notif) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: notif });
  } catch (err) { next(err); }
};

/**
 * @desc    Delete notification
 * @route   DELETE /api/notifications/:id
 * @access  Teacher only
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) { next(err); }
};
