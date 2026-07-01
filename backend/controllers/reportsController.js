// controllers/reportsController.js — Analytics reports & CSV export
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Fees = require('../models/Fees');
const Task = require('../models/Task');
const Library = require('../models/Library');

/**
 * Convert array of objects to CSV string
 */
const toCSV = (rows, headers) => {
  const headerLine = headers.map(h => `"${h.label}"`).join(',');
  const dataLines = rows.map(row =>
    headers.map(h => {
      const val = h.key.split('.').reduce((o, k) => o?.[k], row);
      return `"${String(val ?? '').replace(/"/g, '""')}"`;
    }).join(',')
  );
  return [headerLine, ...dataLines].join('\n');
};

/**
 * @desc    Attendance summary report
 * @route   GET /api/reports/attendance
 * @access  Teacher only
 */
exports.attendanceSummary = async (req, res, next) => {
  try {
    const { department, semester, format = 'json' } = req.query;

    const matchQuery = {};
    if (department) matchQuery.department = department;
    if (semester) matchQuery.semester = Number(semester);

    const summary = await Attendance.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$student',
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
        },
      },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: '_id',
          as: 'studentInfo',
        },
      },
      { $unwind: '$studentInfo' },
      {
        $lookup: {
          from: 'users',
          localField: 'studentInfo.user',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          studentId: '$studentInfo.studentId',
          name: '$userInfo.name',
          department: '$studentInfo.department',
          semester: '$studentInfo.semester',
          total: 1,
          present: 1,
          absent: 1,
          late: 1,
          percentage: {
            $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1],
          },
          status: {
            $cond: [{ $gte: [{ $divide: ['$present', '$total'] }, 0.75] }, 'OK', 'LOW'],
          },
        },
      },
      { $sort: { percentage: 1 } },
    ]);

    if (format === 'csv') {
      const csv = toCSV(summary, [
        { label: 'Student ID', key: 'studentId' },
        { label: 'Name', key: 'name' },
        { label: 'Department', key: 'department' },
        { label: 'Semester', key: 'semester' },
        { label: 'Total Classes', key: 'total' },
        { label: 'Present', key: 'present' },
        { label: 'Absent', key: 'absent' },
        { label: 'Late', key: 'late' },
        { label: 'Percentage', key: 'percentage' },
        { label: 'Status', key: 'status' },
      ]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="attendance_report.csv"');
      return res.send(csv);
    }

    res.json({
      success: true,
      count: summary.length,
      lowAttendance: summary.filter(s => s.percentage < 75).length,
      data: summary,
    });
  } catch (err) { next(err); }
};

/**
 * @desc    Fee collection report
 * @route   GET /api/reports/fees
 * @access  Teacher only
 */
exports.feesReport = async (req, res, next) => {
  try {
    const { academicYear, department, format = 'json' } = req.query;

    // Aggregate fees with student info
    const pipeline = [
      ...(academicYear ? [{ $match: { academicYear } }] : []),
      {
        $lookup: {
          from: 'students',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo',
        },
      },
      { $unwind: '$studentInfo' },
      ...(department ? [{ $match: { 'studentInfo.department': department } }] : []),
      {
        $lookup: {
          from: 'users',
          localField: 'studentInfo.user',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          studentId: '$studentInfo.studentId',
          name: '$userInfo.name',
          department: '$studentInfo.department',
          semester: '$semester',
          feeType: 1,
          totalAmount: 1,
          paidAmount: { $sum: '$payments.amount' },
          status: 1,
          dueDate: 1,
          academicYear: 1,
        },
      },
      { $addFields: { balance: { $subtract: ['$totalAmount', '$paidAmount'] } } },
      { $sort: { 'studentInfo.department': 1, status: 1 } },
    ];

    const data = await Fees.aggregate(pipeline);

    const totals = data.reduce(
      (acc, f) => {
        acc.totalDue += f.totalAmount;
        acc.totalPaid += f.paidAmount;
        acc.totalBalance += f.balance;
        return acc;
      },
      { totalDue: 0, totalPaid: 0, totalBalance: 0 }
    );

    if (format === 'csv') {
      const csv = toCSV(data, [
        { label: 'Student ID', key: 'studentId' },
        { label: 'Name', key: 'name' },
        { label: 'Department', key: 'department' },
        { label: 'Semester', key: 'semester' },
        { label: 'Fee Type', key: 'feeType' },
        { label: 'Total Amount', key: 'totalAmount' },
        { label: 'Amount Paid', key: 'paidAmount' },
        { label: 'Balance', key: 'balance' },
        { label: 'Status', key: 'status' },
        { label: 'Due Date', key: 'dueDate' },
        { label: 'Academic Year', key: 'academicYear' },
      ]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="fees_report.csv"');
      return res.send(csv);
    }

    res.json({ success: true, count: data.length, totals, data });
  } catch (err) { next(err); }
};

/**
 * @desc    Student academic performance overview
 * @route   GET /api/reports/performance
 * @access  Teacher only
 */
exports.performanceReport = async (req, res, next) => {
  try {
    const { department, semester } = req.query;

    const query = {};
    if (department) query.department = department;
    if (semester) query.semester = Number(semester);

    const students = await Student.find(query)
      .populate('user', 'name email')
      .lean();

    // Get attendance percentage for each student in parallel
    const enriched = await Promise.all(
      students.map(async (s) => {
        const attStats = await Attendance.getAttendancePercentage(s._id);
        const overallAtt =
          attStats.length > 0
            ? Math.round(
                (attStats.reduce((sum, a) => sum + a.present, 0) /
                  attStats.reduce((sum, a) => sum + a.total, 0)) *
                  100
              )
            : 0;

        const pendingFees = await Fees.countDocuments({
          student: s._id,
          status: { $in: ['pending', 'partial', 'overdue'] },
        });

        const overdueBooks = await Library.countDocuments({
          student: s._id,
          status: 'overdue',
        });

        return {
          studentId: s.studentId,
          name: s.user?.name,
          email: s.user?.email,
          department: s.department,
          semester: s.semester,
          cgpa: s.cgpa,
          attendance: overallAtt,
          pendingFees,
          overdueBooks,
          riskLevel:
            overallAtt < 60 || pendingFees >= 2
              ? 'HIGH'
              : overallAtt < 75 || pendingFees >= 1
              ? 'MEDIUM'
              : 'LOW',
        };
      })
    );

    res.json({
      success: true,
      count: enriched.length,
      highRisk: enriched.filter(s => s.riskLevel === 'HIGH').length,
      data: enriched.sort((a, b) =>
        a.riskLevel === 'HIGH' ? -1 : b.riskLevel === 'HIGH' ? 1 : 0
      ),
    });
  } catch (err) { next(err); }
};

/**
 * @desc    Library utilization report
 * @route   GET /api/reports/library
 * @access  Teacher only
 */
exports.libraryReport = async (req, res, next) => {
  try {
    const [statusSummary, fineSummary, topBorrowers] = await Promise.all([
      Library.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Library.aggregate([
        { $group: { _id: null, totalFine: { $sum: '$fine.amount' }, paidFine: { $sum: { $cond: ['$fine.paid', '$fine.amount', 0] } } } },
      ]),
      Library.aggregate([
        { $group: { _id: '$student', count: { $sum: 1 }, totalFine: { $sum: '$fine.amount' } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'students', localField: '_id', foreignField: '_id', as: 'student' } },
        { $unwind: '$student' },
        { $lookup: { from: 'users', localField: 'student.user', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { name: '$user.name', studentId: '$student.studentId', count: 1, totalFine: 1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        byStatus: statusSummary,
        fines: fineSummary[0] || { totalFine: 0, paidFine: 0 },
        topBorrowers,
      },
    });
  } catch (err) { next(err); }
};
