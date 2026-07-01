// models/Fees.js — Fee management schema
const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  paidOn: { type: Date, default: Date.now },
  method: {
    type: String,
    enum: ['cash', 'online', 'cheque', 'dd'],
    default: 'cash',
  },
  transactionId: { type: String, trim: true },
  receiptNumber: { type: String, trim: true },
});

const FeesSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    feeType: {
      type: String,
      enum: ['tuition', 'hostel', 'library', 'exam', 'lab', 'sports', 'other'],
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: 0,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    semester: {
      type: Number,
      required: true,
    },
    academicYear: {
      type: String, // e.g., "2024-2025"
      required: true,
    },
    payments: [PaymentSchema],
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'overdue', 'waived'],
      default: 'pending',
    },
    waiver: {
      amount: { type: Number, default: 0 },
      reason: { type: String },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: total paid
FeesSchema.virtual('paidAmount').get(function () {
  //return this.payments.reduce((sum, p) => sum + p.amount, 0) + (this.waiver?.amount || 0);
  return (this.payments || []).reduce((sum, p) => sum + p.amount, 0) + (this.waiver?.amount || 0);
});

// Virtual: balance due
FeesSchema.virtual('balanceAmount').get(function () {
  return Math.max(0, this.totalAmount - this.paidAmount);
});

// Pre-save: auto update status
FeesSchema.pre('save', function (next) {
  const paid = (this.payments || []).reduce((sum, p) => sum + p.amount, 0) + (this.waiver?.amount || 0);
  if (paid === 0) {
    this.status = new Date() > this.dueDate ? 'overdue' : 'pending';
  } else if (paid >= this.totalAmount) {
    this.status = 'paid';
  } else {
    this.status = new Date() > this.dueDate ? 'overdue' : 'partial';
  }
  if (this.waiver?.amount > 0 && paid >= this.totalAmount) this.status = 'waived';
  next();
});

module.exports = mongoose.model('Fees', FeesSchema);
