// controllers/timetableController.js
const Timetable = require('../models/Timetable');

exports.createTimetable = async (req, res, next) => {
  try {
    const existing = await Timetable.findOne({
      department: req.body.department,
      semester: req.body.semester,
      section: req.body.section || 'A',
      academicYear: req.body.academicYear,
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Timetable already exists. Use update instead.' });
    }
    const timetable = await Timetable.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json({ success: true, data: timetable });
  } catch (err) { next(err); }
};

exports.getTimetable = async (req, res, next) => {
  try {
    const { department, semester, section = 'A', academicYear } = req.query;
    const timetable = await Timetable.findOne({ department, semester: Number(semester), section, academicYear });
    if (!timetable) return res.status(404).json({ success: false, message: 'Timetable not found' });
    res.json({ success: true, data: timetable });
  } catch (err) { next(err); }
};

exports.updateTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!timetable) return res.status(404).json({ success: false, message: 'Timetable not found' });
    res.json({ success: true, data: timetable });
  } catch (err) { next(err); }
};

exports.deleteTimetable = async (req, res, next) => {
  try {
    await Timetable.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Timetable deleted' });
  } catch (err) { next(err); }
};

exports.getAllTimetables = async (req, res, next) => {
  try {
    const timetables = await Timetable.find({ isActive: true }).populate('createdBy', 'name');
    res.json({ success: true, data: timetables });
  } catch (err) { next(err); }
};
