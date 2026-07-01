// routes/reports.routes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  attendanceSummary, feesReport, performanceReport, libraryReport,
} = require('../controllers/reportsController');

// All report routes teacher-only
router.get('/attendance',   protect, authorize('teacher'), attendanceSummary);
router.get('/fees',         protect, authorize('teacher'), feesReport);
router.get('/performance',  protect, authorize('teacher'), performanceReport);
router.get('/library',      protect, authorize('teacher'), libraryReport);

module.exports = router;
