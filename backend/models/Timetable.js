// models/Timetable.js — Weekly timetable schema
const mongoose = require('mongoose');

const TimetableSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: true,
    },
    semester: {
      type: Number,
      required: true,
    },
    section: {
      type: String,
      default: 'A',
    },
    academicYear: {
      type: String,
      required: true,
    },
    schedule: [
      {
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          required: true,
        },
        periods: [
          {
            periodNumber: { type: Number, required: true },
            subject: { type: String, required: true },
            teacher: { type: String, default: '' },
            teacherRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            startTime: { type: String, required: true }, // "09:00"
            endTime: { type: String, required: true },   // "10:00"
            room: { type: String },
            type: {
              type: String,
              enum: ['lecture', 'lab', 'tutorial', 'break'],
              default: 'lecture',
            },
          },
        ],
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

TimetableSchema.index({ department: 1, semester: 1, section: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('Timetable', TimetableSchema);
