// controllers/dashboardController.js — Dashboard analytics
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Fees = require('../models/Fees');
const Task = require('../models/Task');
const Library = require('../models/Library');
const User = require('../models/User');

/**
 * @desc    Teacher dashboard analytics
 * @route   GET /api/dashboard/teacher
 * @access  Teacher only
 */
exports.getTeacherDashboard = async (req, res, next) => {
  try {
    // Run all aggregations in parallel
    const [
      totalStudents,
      activeStudents,
      studentsByDept,
      feeStats,
      attendanceToday,
      overdueBooks,
      pendingTasks,
      recentStudents,
    ] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ status: 'active' }),
      Student.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Fees.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' },
          },
        },
      ]),
      Attendance.countDocuments({ date: { $gte: new Date().setHours(0, 0, 0, 0) } }),
      Library.countDocuments({ status: 'overdue' }),
      Task.countDocuments({ status: 'published', dueDate: { $gte: new Date() } }),
      Student.find({ status: 'active' })
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    // Compute fee summary
    const feeSummary = { totalDue: 0, totalPaid: 0, pending: 0, overdue: 0 };
    feeStats.forEach((s) => {
      if (s._id === 'paid') feeSummary.totalPaid += s.totalAmount;
      else feeSummary.totalDue += s.totalAmount;
      if (s._id === 'pending' || s._id === 'partial') feeSummary.pending += s.count;
      if (s._id === 'overdue') feeSummary.overdue += s.count;
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalStudents,
          activeStudents,
          attendanceToday,
          overdueBooks,
          pendingTasks,
          feeDefaulters: feeSummary.overdue,
        },
        feeSummary,
        studentsByDepartment: studentsByDept,
        recentStudents,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Student dashboard — personal analytics
 * @route   GET /api/dashboard/student
 * @access  Student only
 */
exports.getStudentDashboard = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user.id }).lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    const studentId = student._id;

    const [attendanceSummary, feeSummary, libraryRecords, upcomingTasks] = await Promise.all([
      Attendance.getAttendancePercentage(studentId),
      Fees.find({ student: studentId, status: { $in: ['pending', 'partial', 'overdue'] } }).select('feeType totalAmount dueDate status'),
      Library.find({ student: studentId, status: { $in: ['borrowed', 'overdue'] } }),
      Task.find({
        department: student.department,
        semester: student.semester,
        status: 'published',
        dueDate: { $gte: new Date() },
      }).select('title subject dueDate priority type').sort({ dueDate: 1 }).limit(5),
    ]);

    // Overall attendance percentage
    const totalClasses = attendanceSummary.reduce((sum, s) => sum + s.total, 0);
    const totalPresent = attendanceSummary.reduce((sum, s) => sum + s.present, 0);
    const overallAttendance = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;

    const pendingFees = feeSummary.reduce((sum, f) => {
      const paid = 0; // simplified
      return sum + f.totalAmount;
    }, 0);

    res.json({
      success: true,
      data: {
        student: {
          name: req.user.name,
          studentId: student.studentId,
          department: student.department,
          semester: student.semester,
          cgpa: student.cgpa,
        },
        stats: {
          overallAttendance,
          pendingFeesCount: feeSummary.length,
          activeBorrowedBooks: libraryRecords.length,
          upcomingTasksCount: upcomingTasks.length,
        },
        attendanceBySubject: attendanceSummary,
        pendingFees: feeSummary,
        borrowedBooks: libraryRecords,
        upcomingTasks,
      },
    });
  } catch (err) {
    next(err);
  }
};
