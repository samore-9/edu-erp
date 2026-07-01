// controllers/attendanceController.js — Attendance management
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

/**
 * @desc    Mark attendance for a student
 * @route   POST /api/attendance
 * @access  Teacher only
 */
exports.markAttendance = async (req, res, next) => {
  try {
    const { studentId, subject, date, status, remarks, lectureNumber } = req.body;

    // Check if attendance already marked
    const existing = await Attendance.findOne({
      student: studentId,
      subject,
      date: new Date(date),
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this student on this date for this subject',
      });
    }

    // Get student for department/semester info
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const attendance = await Attendance.create({
      student: studentId,
      subject,
      date: new Date(date),
      status,
      remarks,
      lectureNumber,
      markedBy: req.user.id,
      semester: student.semester,
      department: student.department,
    });

    res.status(201).json({ success: true, data: attendance });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Bulk mark attendance (entire class at once)
 * @route   POST /api/attendance/bulk
 * @access  Teacher only
 */
exports.bulkMarkAttendance = async (req, res, next) => {
  try {
    const { records, subject, date, department, semester } = req.body;
    // records: [{ studentId, status, remarks }]

    const attendanceDocs = records.map((r) => ({
      student: r.studentId,
      subject,
      date: new Date(date),
      status: r.status,
      remarks: r.remarks || '',
      markedBy: req.user.id,
      department,
      semester,
    }));

    // Use insertMany with ordered:false to skip duplicates
    const result = await Attendance.insertMany(attendanceDocs, { ordered: false }).catch((err) => {
      if (err.code === 11000) return err.insertedDocs || [];
      throw err;
    });

    res.status(201).json({
      success: true,
      message: `Attendance marked for ${Array.isArray(result) ? result.length : 0} students`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get attendance for a student
 * @route   GET /api/attendance/student/:studentId
 * @access  Teacher | Student (own)
 */
exports.getStudentAttendance = async (req, res, next) => {
  try {
    const { subject, month, year } = req.query;
    const query = { student: req.params.studentId };

    if (subject) query.subject = subject;
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      query.date = { $gte: start, $lte: end };
    }

    const records = await Attendance.find(query)
      .sort({ date: -1 })
      .populate('markedBy', 'name');

    // Get percentage summary
    const summary = await Attendance.getAttendancePercentage(req.params.studentId);

    res.json({ success: true, data: records, summary });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update an attendance record
 * @route   PUT /api/attendance/:id
 * @access  Teacher only
 */
exports.updateAttendance = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      { status, remarks },
      { new: true, runValidators: true }
    );

    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    res.json({ success: true, data: attendance });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get attendance report for a class (department + semester)
 * @route   GET /api/attendance/report
 * @access  Teacher only
 */
exports.getClassReport = async (req, res, next) => {
  try {
    const { department, semester, subject, date } = req.query;
    const query = { department, semester: Number(semester) };
    if (subject) query.subject = subject;
    if (date) query.date = new Date(date);

    const records = await Attendance.find(query)
      .populate({ path: 'student', populate: { path: 'user', select: 'name' } })
      .sort({ date: -1 });

    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    next(err);
  }
};
