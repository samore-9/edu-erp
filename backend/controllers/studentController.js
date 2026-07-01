// controllers/studentController.js — Student CRUD operations
const Student = require('../models/Student');
const User = require('../models/User');

/**
 * @desc    Get all students (with filters)
 * @route   GET /api/students
 * @access  Teacher only
 */
exports.getAllStudents = async (req, res, next) => {
  try {
    const { department, semester, status, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (department) query.department = department;
    if (semester) query.semester = Number(semester);
    if (status) query.status = status;

    let studentQuery = Student.find(query).populate('user', 'name email lastLogin isActive');

    // Text search by studentId or rollNumber
    if (search) {
      studentQuery = Student.find({
        ...query,
        $or: [
          { studentId: { $regex: search, $options: 'i' } },
          { rollNumber: { $regex: search, $options: 'i' } },
        ],
      }).populate('user', 'name email');
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Student.countDocuments(query);
    const students = await studentQuery
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      count: students.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
      data: students,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single student by ID
 * @route   GET /api/students/:id
 * @access  Teacher | Student (own only)
 */
exports.getStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).populate('user', 'name email lastLogin');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create new student (also creates user account)
 * @route   POST /api/students
 * @access  Teacher only
 */
exports.createStudent = async (req, res, next) => {
  try {
    const { name, email, password, ...studentData } = req.body;

    // Check for duplicate email or studentId
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const studentIdExists = await Student.findOne({ studentId: studentData.studentId });
    if (studentIdExists) {
      return res.status(400).json({ success: false, message: 'Student ID already exists' });
    }

    // Create user account
    const user = await User.create({
      name,
      email,
      password: password || 'Student@123', // default password
      role: 'student',
    });

    // Create student profile
    const student = await Student.create({ ...studentData, user: user._id });

    // Link profile to user
    user.studentProfile = student._id;
    await user.save({ validateBeforeSave: false });

    const populated = await Student.findById(student._id).populate('user', 'name email');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update student profile
 * @route   PUT /api/students/:id
 * @access  Teacher only
 */
exports.updateStudent = async (req, res, next) => {
  try {
    // Prevent changing critical fields
    const { user, studentId, ...updateData } = req.body;

    const student = await Student.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate('user', 'name email');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete student (also deactivates user)
 * @route   DELETE /api/students/:id
 * @access  Teacher only
 */
exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Deactivate user account instead of hard delete
    await User.findByIdAndUpdate(student.user, { isActive: false });
    await student.deleteOne();

    res.json({ success: true, message: 'Student removed successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get logged-in student's own profile
 * @route   GET /api/students/me
 * @access  Student
 */
exports.getMyProfile = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user.id }).populate('user', 'name email lastLogin');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }
    res.json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
};
