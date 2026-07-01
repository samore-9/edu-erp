// models/Student.js — Comprehensive student profile schema
const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema(
  {
    // Linked user account
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Academic Info
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      unique: true,
      trim: true,
    },
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'MBA', 'MCA', 'Other'],
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 8,
    },
    year: {
      type: Number,
      required: true,
      min: 1,
      max: 4,
    },
    batch: {
      type: String, // e.g., "2022-2026"
      required: true,
    },
    section: {
      type: String,
      default: 'A',
    },
    // Personal Info
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    // Guardian Info
    guardian: {
      name: String,
      relation: String,
      phone: String,
      email: String,
    },
    // Academic Status
    cgpa: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'alumni', 'suspended'],
      default: 'active',
    },
    admissionDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    // Virtual for full name from User
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for fast lookup
StudentSchema.index({ studentId: 1, department: 1, semester: 1 });

module.exports = mongoose.model('Student', StudentSchema);
