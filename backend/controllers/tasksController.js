// controllers/tasksController.js — Task / Assignment management
const Task = require('../models/Task');
const Student = require('../models/Student');

exports.createTask = async (req, res, next) => {
  try {
    const task = await Task.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json({ success: true, data: task });
  } catch (err) { next(err); }
};

exports.getAllTasks = async (req, res, next) => {
  try {
    const { department, semester, subject, status } = req.query;
    const query = {};
    if (department) query.department = department;
    if (semester) query.semester = Number(semester);
    if (subject) query.subject = subject;
    if (status) query.status = status;

    const tasks = await Task.find(query)
      .populate('createdBy', 'name')
      .select('-submissions') // Don't send all submissions in list view
      .sort({ dueDate: 1 });

    res.json({ success: true, data: tasks });
  } catch (err) { next(err); }
};

exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('submissions.student');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Students only see their own submission
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user.id });
      const mySubmission = task.submissions.find(
        (s) => s.student.toString() === student?._id.toString()
      );
      const taskObj = task.toObject();
      taskObj.mySubmission = mySubmission || null;
      taskObj.submissions = undefined;
      return res.json({ success: true, data: taskObj });
    }

    res.json({ success: true, data: task });
  } catch (err) { next(err); }
};

exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (err) { next(err); }
};

exports.deleteTask = async (req, res, next) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) { next(err); }
};

exports.submitTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (task.status === 'closed') return res.status(400).json({ success: false, message: 'Task is closed for submissions' });

    const student = await Student.findOne({ user: req.user.id });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    // Check existing submission
    const existingIdx = task.submissions.findIndex(
      (s) => s.student.toString() === student._id.toString()
    );

    const submissionData = {
      student: student._id,
      content: req.body.content,
      fileUrl: req.body.fileUrl,
      status: new Date() > task.dueDate ? 'late' : 'submitted',
    };

    if (existingIdx >= 0) {
      task.submissions[existingIdx] = { ...task.submissions[existingIdx].toObject(), ...submissionData };
    } else {
      task.submissions.push(submissionData);
    }

    await task.save();
    res.json({ success: true, message: 'Task submitted successfully' });
  } catch (err) { next(err); }
};

exports.gradeSubmission = async (req, res, next) => {
  try {
    const { submissionId, score, letter, feedback } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const submission = task.submissions.id(submissionId);
    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });

    submission.grade = { score, maxScore: task.maxScore, letter, feedback, gradedBy: req.user.id, gradedAt: new Date() };
    submission.status = 'graded';
    await task.save();

    res.json({ success: true, message: 'Submission graded', data: submission });
  } catch (err) { next(err); }
};

// Student: get their own tasks
exports.getMyTasks = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    const tasks = await Task.find({
      department: student.department,
      semester: student.semester,
      status: 'published',
    }).populate('createdBy', 'name').sort({ dueDate: 1 });

    // Add submission status for each task
    const tasksWithStatus = tasks.map((t) => {
      const obj = t.toObject();
      const mySubmission = t.submissions.find(
        (s) => s.student.toString() === student._id.toString()
      );
      obj.submissionStatus = mySubmission ? mySubmission.status : 'not_submitted';
      obj.mySubmission = mySubmission || null;
      obj.submissions = undefined;
      return obj;
    });

    res.json({ success: true, data: tasksWithStatus });
  } catch (err) { next(err); }
};
