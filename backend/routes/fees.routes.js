// routes/fees.routes.js
const express = require('express');
const router = express.Router();
const { protect, authorize, studentSelf } = require('../middleware/auth');
const { createFee, getStudentFees, recordPayment, applyWaiver, getFeeStats, getAllFees } = require('../controllers/feesController');

router.get('/stats', protect, authorize('teacher'), getFeeStats);
router.route('/')
  .get(protect, authorize('teacher'), getAllFees)
  .post(protect, authorize('teacher'), createFee);

router.get('/student/:studentId', protect, studentSelf, getStudentFees);
router.post('/:id/pay', protect, authorize('teacher'), recordPayment);
router.put('/:id/waiver', protect, authorize('teacher'), applyWaiver);

module.exports = router;
