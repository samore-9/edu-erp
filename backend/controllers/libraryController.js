// controllers/libraryController.js — Library management
const Library = require('../models/Library');

exports.issueBook = async (req, res, next) => {
  try {
    // Check if student already has 3 books issued
    const activeCount = await Library.countDocuments({ student: req.body.student, status: { $in: ['borrowed', 'overdue'] } });
    if (activeCount >= 3) {
      return res.status(400).json({ success: false, message: 'Student already has 3 books issued. Return a book first.' });
    }

    // Set due date to 14 days from today
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const record = await Library.create({ ...req.body, dueDate: req.body.dueDate || dueDate, issuedBy: req.user.id });
    res.status(201).json({ success: true, data: record });
  } catch (err) { next(err); }
};

exports.returnBook = async (req, res, next) => {
  try {
    const record = await Library.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Library record not found' });
    if (record.status === 'returned') return res.status(400).json({ success: false, message: 'Book already returned' });

    record.returnedDate = new Date();
    record.status = 'returned';
    record.returnAcceptedBy = req.user.id;
    await record.save();

    res.json({ success: true, data: record, message: record.fine.amount > 0 ? `Book returned. Fine: ₹${record.fine.amount}` : 'Book returned successfully' });
  } catch (err) { next(err); }
};

exports.getStudentLibrary = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { student: req.params.studentId };
    if (status) query.status = status;
    const records = await Library.find(query).sort({ borrowedDate: -1 });
    res.json({ success: true, data: records });
  } catch (err) { next(err); }
};

exports.getAllLibraryRecords = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const records = await Library.find(query)
      .populate({ path: 'student', populate: { path: 'user', select: 'name' } })
      .sort({ borrowedDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Library.countDocuments(query);
    res.json({ success: true, total, data: records });
  } catch (err) { next(err); }
};

exports.updateLibraryRecord = async (req, res, next) => {
  try {
    const record = await Library.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, data: record });
  } catch (err) { next(err); }
};
