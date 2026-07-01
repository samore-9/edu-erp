// routes/tasks.routes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { createTask, getAllTasks, getTask, updateTask, deleteTask, submitTask, gradeSubmission, getMyTasks } = require('../controllers/tasksController');

router.get('/my', protect, authorize('student'), getMyTasks);

router.route('/')
  .get(protect, getAllTasks)
  .post(protect, authorize('teacher'), createTask);

router.route('/:id')
  .get(protect, getTask)
  .put(protect, authorize('teacher'), updateTask)
  .delete(protect, authorize('teacher'), deleteTask);

router.post('/:id/submit', protect, authorize('student'), submitTask);
router.post('/:id/grade', protect, authorize('teacher'), gradeSubmission);

module.exports = router;
