// routes/student.routes.js
const express = require('express');
const router = express.Router();
const { protect, authorize, studentSelf } = require('../middleware/auth');
const {
  getAllStudents, getStudent, createStudent, updateStudent, deleteStudent, getMyProfile,
} = require('../controllers/studentController');

// Student's own profile
router.get('/me', protect, authorize('student'), getMyProfile);

// Teacher-only routes
router.route('/')
  .get(protect, authorize('teacher'), getAllStudents)
  .post(protect, authorize('teacher'), createStudent);

router.route('/:id')
  .get(protect, studentSelf, getStudent)
  .put(protect, authorize('teacher'), updateStudent)
  .delete(protect, authorize('teacher'), deleteStudent);

module.exports = router;
