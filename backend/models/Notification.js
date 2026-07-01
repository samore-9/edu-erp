// models/Notification.js — In-app announcements and alerts
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: 2000,
    },
    type: {
      type: String,
      enum: ['info', 'warning', 'success', 'danger', 'announcement'],
      default: 'info',
    },
    // Targeting
    targetRole: {
      type: String,
      enum: ['all', 'teacher', 'student'],
      default: 'all',
    },
    targetDepartment: {
      type: String,
      default: null, // null = all departments
    },
    targetSemester: {
      type: Number,
      default: null, // null = all semesters
    },
    // Sender
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Read tracking — array of user IDs who read it
    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Auto-expire index
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });
NotificationSchema.index({ targetRole: 1, targetDepartment: 1, isActive: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
