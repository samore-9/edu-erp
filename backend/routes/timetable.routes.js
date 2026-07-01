// routes/timetable.routes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { createTimetable, getTimetable, updateTimetable, deleteTimetable, getAllTimetables } = require('../controllers/timetableController');

router.route('/')
  .get(protect, getTimetable)              // Both roles can view
  .post(protect, authorize('teacher'), createTimetable);

router.get('/all', protect, authorize('teacher'), getAllTimetables);

router.route('/:id')
  .put(protect, authorize('teacher'), updateTimetable)
  .delete(protect, authorize('teacher'), deleteTimetable);

module.exports = router;
