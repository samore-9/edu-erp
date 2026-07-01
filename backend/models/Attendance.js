// models/Attendance.js — Attendance tracking schema
const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      required: true,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    // For lecture tracking
    lectureNumber: {
      type: Number,
    },
    semester: {
      type: Number,
    },
    department: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate attendance entries for same student/subject/date
AttendanceSchema.index({ student: 1, subject: 1, date: 1 }, { unique: true });

// Static method to calculate attendance percentage
AttendanceSchema.statics.getAttendancePercentage = async function (studentId, subject = null) {
  const matchQuery = { student: studentId };
  if (subject) matchQuery.subject = subject;

  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$subject',
        total: { $sum: 1 },
        present: {
          $sum: {
            $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        subject: '$_id',
        total: 1,
        present: 1,
        percentage: {
          $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1],
        },
      },
    },
  ]);

  return stats;
};

module.exports = mongoose.model('Attendance', AttendanceSchema);
