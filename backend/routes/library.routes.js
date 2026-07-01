// routes/library.routes.js
const express = require('express');
const router = express.Router();
const { protect, authorize, studentSelf } = require('../middleware/auth');
const { issueBook, returnBook, getStudentLibrary, getAllLibraryRecords, updateLibraryRecord } = require('../controllers/libraryController');

router.route('/')
  .get(protect, authorize('teacher'), getAllLibraryRecords)
  .post(protect, authorize('teacher'), issueBook);

router.get('/student/:studentId', protect, studentSelf, getStudentLibrary);
router.put('/:id/return', protect, authorize('teacher'), returnBook);
router.put('/:id', protect, authorize('teacher'), updateLibraryRecord);

module.exports = router;
