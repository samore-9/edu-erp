// routes/attendance.routes.js
const express = require('express');
const router = express.Router();
const { protect, authorize, studentSelf } = require('../middleware/auth');
const { markAttendance, bulkMarkAttendance, getStudentAttendance, updateAttendance, getClassReport } = require('../controllers/attendanceController');

router.post('/', protect, authorize('teacher'), markAttendance);
router.post('/bulk', protect, authorize('teacher'), bulkMarkAttendance);
router.get('/report', protect, authorize('teacher'), getClassReport);
router.get('/student/:studentId', protect, studentSelf, getStudentAttendance);
router.put('/:id', protect, authorize('teacher'), updateAttendance);

module.exports = router;
