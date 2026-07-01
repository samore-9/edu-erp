// controllers/feesController.js — Fee management
const Fees = require('../models/Fees');

/**
 * @desc    Create a fee record for a student
 * @route   POST /api/fees
 * @access  Teacher only
 */
exports.createFee = async (req, res, next) => {
  try {
    const fee = await Fees.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json({ success: true, data: fee });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all fees for a student
 * @route   GET /api/fees/student/:studentId
 * @access  Teacher | Student (own)
 */
exports.getStudentFees = async (req, res, next) => {
  try {
    const { academicYear, feeType } = req.query;
    const query = { student: req.params.studentId };
    if (academicYear) query.academicYear = academicYear;
    if (feeType) query.feeType = feeType;

    const fees = await Fees.find(query)
      .populate('createdBy', 'name')
      .sort({ dueDate: -1 });

    // Summary
    const totalDue = fees.reduce((sum, f) => sum + f.totalAmount, 0);
    const totalPaid = fees.reduce((sum, f) => sum + (f.paidAmount || 0), 0);

    res.json({
      success: true,
      data: fees,
      summary: { totalDue, totalPaid, totalBalance: totalDue - totalPaid },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Record a payment against a fee
 * @route   POST /api/fees/:id/pay
 * @access  Teacher only
 */
exports.recordPayment = async (req, res, next) => {
  try {
    const { amount, method, transactionId, receiptNumber } = req.body;

    const fee = await Fees.findById(req.params.id);
    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee record not found' });
    }

    const alreadyPaid = fee.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = fee.totalAmount - alreadyPaid - (fee.waiver?.amount || 0);

    if (amount > balance) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (₹${amount}) exceeds balance due (₹${balance})`,
      });
    }

    fee.payments.push({ amount, method, transactionId, receiptNumber });
    await fee.save();

    res.json({ success: true, data: fee, message: 'Payment recorded successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Apply waiver to a fee
 * @route   PUT /api/fees/:id/waiver
 * @access  Teacher only
 */
exports.applyWaiver = async (req, res, next) => {
  try {
    const { amount, reason } = req.body;
    const fee = await Fees.findById(req.params.id);
    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee record not found' });
    }

    fee.waiver = { amount, reason, approvedBy: req.user.id };
    await fee.save();

    res.json({ success: true, data: fee, message: 'Waiver applied successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get overall fee statistics (teacher dashboard)
 * @route   GET /api/fees/stats
 * @access  Teacher only
 */
exports.getFeeStats = async (req, res, next) => {
  try {
    const stats = await Fees.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
        },
      },
    ]);

    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all fees (with filters)
 * @route   GET /api/fees
 * @access  Teacher only
 */
exports.getAllFees = async (req, res, next) => {
  try {
    const { status, academicYear, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (academicYear) query.academicYear = academicYear;

    const total = await Fees.countDocuments(query);
    const fees = await Fees.find(query)
      .populate({ path: 'student', populate: { path: 'user', select: 'name' } })
      .sort({ dueDate: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, data: fees });
  } catch (err) {
    next(err);
  }
};
