// models/Library.js — Library book & borrowing records schema
const mongoose = require('mongoose');

const LibrarySchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    bookTitle: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
    },
    author: {
      type: String,
      trim: true,
    },
    isbn: {
      type: String,
      trim: true,
    },
    bookId: {
      type: String,
      trim: true,
    },
    borrowedDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    returnedDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['borrowed', 'returned', 'overdue', 'lost'],
      default: 'borrowed',
    },
    fine: {
      amount: { type: Number, default: 0 },
      paid: { type: Boolean, default: false },
      paidDate: { type: Date },
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    returnAcceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: overdue days
LibrarySchema.virtual('overdueDays').get(function () {
  if (this.status === 'returned') return 0;
  const today = new Date();
  const due = new Date(this.dueDate);
  const diff = Math.floor((today - due) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
});

// Pre-save: auto calculate fine (₹2 per overdue day)
LibrarySchema.pre('save', function (next) {
  if (this.status !== 'returned' && this.status !== 'lost') {
    const checkDate = this.returnedDate || new Date();
    const due = new Date(this.dueDate);
    if (checkDate > due) {
      const days = Math.floor((checkDate - due) / (1000 * 60 * 60 * 24));
      this.fine.amount = days * 2;
      this.status = this.returnedDate ? 'returned' : 'overdue';
    }
  }
  next();
});

module.exports = mongoose.model('Library', LibrarySchema);
