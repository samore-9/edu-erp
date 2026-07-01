// utils/seeder.js — Seed demo data for development
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const path = require("path");

const User         = require('../models/User');
const Student      = require('../models/Student');
const Task         = require('../models/Task');
const Fees         = require('../models/Fees');
const Attendance   = require('../models/Attendance');
const Timetable    = require('../models/Timetable');
const Library      = require('../models/Library');
const Notification = require('../models/Notification');

connectDB();

const seed = async () => {
  try {
    // ── Wipe existing data ──────────────────────────────────────────────
    await Promise.all([
      User.deleteMany(), Student.deleteMany(), Task.deleteMany(),
      Fees.deleteMany(), Attendance.deleteMany(), Timetable.deleteMany(),
      Library.deleteMany(), Notification.deleteMany(),
    ]);
    console.log('🗑️  Cleared existing data');

    // ── Teacher ─────────────────────────────────────────────────────────
    const teacher = await User.create({
      name: 'Prof. Ramesh Kumar',
      email: 'teacher@college.edu',
      password: 'teacher123',
      role: 'teacher',
    });
    console.log('👨‍🏫 Teacher created: teacher@college.edu / teacher123');

    // ── Students ─────────────────────────────────────────────────────────
    const studentsData = [
      { name: 'Priya Sharma',  email: 'priya@student.edu',  studentId: 'CS2024001', rollNumber: '101', department: 'Computer Science',      semester: 4, year: 2, batch: '2022-2026', section: 'A', cgpa: 8.5, phone: '9876543210', gender: 'Female' },
      { name: 'Rahul Verma',   email: 'rahul@student.edu',  studentId: 'CS2024002', rollNumber: '102', department: 'Computer Science',      semester: 4, year: 2, batch: '2022-2026', section: 'A', cgpa: 7.8, phone: '9876543211', gender: 'Male' },
      { name: 'Anjali Singh',  email: 'anjali@student.edu', studentId: 'IT2024001', rollNumber: '201', department: 'Information Technology', semester: 2, year: 1, batch: '2023-2027', section: 'B', cgpa: 9.1, phone: '9876543212', gender: 'Female' },
      { name: 'Arjun Mehta',   email: 'arjun@student.edu',  studentId: 'CS2024003', rollNumber: '103', department: 'Computer Science',      semester: 4, year: 2, batch: '2022-2026', section: 'A', cgpa: 6.4, phone: '9876543213', gender: 'Male' },
      { name: 'Sneha Patel',   email: 'sneha@student.edu',  studentId: 'EC2024001', rollNumber: '301', department: 'Electronics',           semester: 3, year: 2, batch: '2022-2026', section: 'A', cgpa: 7.2, phone: '9876543214', gender: 'Female' },
    ];

    const createdStudents = [];
    for (const sd of studentsData) {
      const { name, email, ...profileData } = sd;
      const user = await User.create({ name, email, password: 'student123', role: 'student' });
      const student = await Student.create({
        ...profileData,
        user: user._id,
        guardian: { name: `Parent of ${name}`, relation: 'Parent', phone: '9000000000', email: `parent.${email}` },
        address: { street: '123 Main Road', city: 'Pune', state: 'Maharashtra', pincode: '411001' },
        dateOfBirth: new Date('2003-06-15'),
      });
      user.studentProfile = student._id;
      await user.save({ validateBeforeSave: false });
      createdStudents.push(student);
    }
    console.log(`🎓 ${studentsData.length} students created (password: student123)`);

    const csStudents = createdStudents.filter(s => s.department === 'Computer Science' && s.semester === 4);
    const firstStudent = createdStudents[0];

    // ── Attendance ────────────────────────────────────────────────────────
    const subjects = ['Data Structures', 'DBMS', 'Operating Systems', 'Web Development', 'Computer Networks'];
    const now = new Date();
    let attCount = 0;
    for (const student of csStudents) {
      for (let i = 1; i <= 30; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        if (d.getDay() === 0 || d.getDay() === 6) continue; // skip weekends
        for (const subj of subjects.slice(0, 3)) {
          try {
            await Attendance.create({
              student: student._id,
              subject: subj,
              date: d,
              // Arjun (index 3 → csStudents index 1) has low attendance
              status: student.studentId === 'CS2024003'
                ? (Math.random() > 0.5 ? 'present' : 'absent')
                : (Math.random() > 0.15 ? 'present' : 'absent'),
              markedBy: teacher._id,
              semester: 4,
              department: 'Computer Science',
            });
            attCount++;
          } catch (e) { /* skip duplicates */ }
        }
      }
    }
    console.log(`📋 ${attCount} attendance records created`);

    // ── Fees ─────────────────────────────────────────────────────────────
    for (const student of createdStudents) {
      // Tuition fee — Priya has paid partially, Arjun is overdue
      const isPaid    = student.studentId === 'CS2024001';
      const isOverdue = student.studentId === 'CS2024003';
      await Fees.create({
        student: student._id,
        feeType: 'tuition',
        description: `Tuition Fee - Semester ${student.semester}`,
        totalAmount: 45000,
        dueDate: isOverdue ? new Date('2024-01-31') : new Date('2024-07-31'),
        semester: student.semester,
        academicYear: '2024-2025',
        createdBy: teacher._id,
        payments: isPaid
          ? [{ amount: 30000, method: 'online', transactionId: 'TXN001', receiptNumber: 'REC001' }]
          : [],
      });

      // Exam fee for all
      await Fees.create({
        student: student._id,
        feeType: 'exam',
        description: 'Examination Fee',
        totalAmount: 2500,
        dueDate: new Date('2024-09-15'),
        semester: student.semester,
        academicYear: '2024-2025',
        createdBy: teacher._id,
        payments: [],
      });
    }
    console.log('💰 Fee records created');

    // ── Library ───────────────────────────────────────────────────────────
    const booksData = [
      { bookTitle: 'Introduction to Algorithms', author: 'Cormen et al.', bookId: 'LIB-CS-001', isbn: '978-0262033848' },
      { bookTitle: 'Database System Concepts',   author: 'Silberschatz',  bookId: 'LIB-CS-002', isbn: '978-0078022159' },
      { bookTitle: 'Clean Code',                 author: 'Robert Martin', bookId: 'LIB-CS-003', isbn: '978-0132350884' },
    ];

    // Priya has a currently borrowed book (due in 5 days)
    await Library.create({
      student: firstStudent._id,
      ...booksData[0],
      dueDate: new Date(Date.now() + 5 * 86400000),
      issuedBy: teacher._id,
    });

    // Rahul has an overdue book
    await Library.create({
      student: createdStudents[1]._id,
      ...booksData[1],
      dueDate: new Date(Date.now() - 7 * 86400000), // 7 days overdue
      issuedBy: teacher._id,
    });

    // Anjali has a returned book
    const returnedLib = await Library.create({
      student: createdStudents[2]._id,
      ...booksData[2],
      dueDate: new Date(Date.now() - 3 * 86400000),
      issuedBy: teacher._id,
    });
    returnedLib.returnedDate = new Date();
    returnedLib.status = 'returned';
    returnedLib.returnAcceptedBy = teacher._id;
    await returnedLib.save();

    console.log('📚 Library records created');

    // ── Tasks ─────────────────────────────────────────────────────────────
    const tasks = await Task.create([
      {
        title: 'Binary Search Tree Implementation',
        type: 'assignment',
        subject: 'Data Structures',
        department: 'Computer Science',
        semester: 4,
        description: 'Implement a BST with insert, delete, and all three traversal operations in C++. Include time complexity analysis.',
        dueDate: new Date(Date.now() + 7 * 86400000),
        maxScore: 50,
        priority: 'high',
        createdBy: teacher._id,
      },
      {
        title: 'ER Diagram for Library System',
        type: 'assignment',
        subject: 'DBMS',
        department: 'Computer Science',
        semester: 4,
        description: 'Design a complete ER diagram for a library management system. Convert to relational schema.',
        dueDate: new Date(Date.now() + 14 * 86400000),
        maxScore: 30,
        priority: 'medium',
        createdBy: teacher._id,
      },
      {
        title: 'Process Scheduling Simulation',
        type: 'project',
        subject: 'Operating Systems',
        department: 'Computer Science',
        semester: 4,
        description: 'Simulate FCFS, SJF, and Round-Robin scheduling algorithms. Compare turnaround time and waiting time.',
        dueDate: new Date(Date.now() + 21 * 86400000),
        maxScore: 100,
        priority: 'high',
        createdBy: teacher._id,
      },
      {
        title: 'HTML/CSS Portfolio Website',
        type: 'assignment',
        subject: 'Web Development',
        department: 'Computer Science',
        semester: 4,
        description: 'Create a personal portfolio website using HTML5, CSS3, and basic JavaScript. Must be responsive.',
        dueDate: new Date(Date.now() + 3 * 86400000),
        maxScore: 40,
        priority: 'medium',
        createdBy: teacher._id,
        // Priya has submitted this
        submissions: [{
          student: firstStudent._id,
          content: 'My portfolio is hosted at github.io/priya-sharma',
          fileUrl: 'https://github.com/priya/portfolio',
          status: 'submitted',
          submittedAt: new Date(Date.now() - 86400000),
        }],
      },
    ]);
    console.log(`📝 ${tasks.length} tasks created`);

    // ── Timetable ─────────────────────────────────────────────────────────
    await Timetable.create({
      department: 'Computer Science',
      semester: 4,
      section: 'A',
      academicYear: '2024-2025',
      createdBy: teacher._id,
      schedule: [
        {
          day: 'Monday',
          periods: [
            { periodNumber: 1, subject: 'Data Structures',   teacher: 'Prof. Ramesh Kumar', teacherRef: teacher._id, startTime: '09:00', endTime: '10:00', room: 'CS-101', type: 'lecture' },
            { periodNumber: 2, subject: 'DBMS',              teacher: 'Prof. Meena Rao',    startTime: '10:00', endTime: '11:00', room: 'CS-102', type: 'lecture' },
            { periodNumber: 3, subject: 'Break',             teacher: 'N/A',                    startTime: '11:00', endTime: '11:15', type: 'break' },
            { periodNumber: 4, subject: 'Operating Systems', teacher: 'Prof. Suresh N.',    startTime: '11:15', endTime: '12:15', room: 'CS-103', type: 'lecture' },
            { periodNumber: 5, subject: 'Web Development',   teacher: 'Prof. Anjali M.',    startTime: '13:15', endTime: '14:15', room: 'CS-Lab1', type: 'lab' },
          ],
        },
        {
          day: 'Tuesday',
          periods: [
            { periodNumber: 1, subject: 'Computer Networks', teacher: 'Prof. Vikram S.',    startTime: '09:00', endTime: '10:00', room: 'CS-104', type: 'lecture' },
            { periodNumber: 2, subject: 'Data Structures',   teacher: 'Prof. Ramesh Kumar', teacherRef: teacher._id, startTime: '10:00', endTime: '11:00', room: 'CS-101', type: 'tutorial' },
            { periodNumber: 3, subject: 'Break',             teacher: 'N/A',                    startTime: '11:00', endTime: '11:15', type: 'break' },
            { periodNumber: 4, subject: 'DBMS Lab',          teacher: 'Prof. Meena Rao',    startTime: '11:15', endTime: '13:15', room: 'DB-Lab', type: 'lab' },
          ],
        },
        {
          day: 'Wednesday',
          periods: [
            { periodNumber: 1, subject: 'Operating Systems', teacher: 'Prof. Suresh N.',    startTime: '09:00', endTime: '10:00', room: 'CS-103', type: 'lecture' },
            { periodNumber: 2, subject: 'Computer Networks', teacher: 'Prof. Vikram S.',    startTime: '10:00', endTime: '11:00', room: 'CS-104', type: 'lecture' },
            { periodNumber: 3, subject: 'Break',             teacher: 'N/A',                    startTime: '11:00', endTime: '11:15', type: 'break' },
            { periodNumber: 4, subject: 'Web Development',   teacher: 'Prof. Anjali M.',    startTime: '11:15', endTime: '12:15', room: 'CS-102', type: 'lecture' },
          ],
        },
        {
          day: 'Thursday',
          periods: [
            { periodNumber: 1, subject: 'DBMS',              teacher: 'Prof. Meena Rao',    startTime: '09:00', endTime: '10:00', room: 'CS-102', type: 'lecture' },
            { periodNumber: 2, subject: 'Data Structures',   teacher: 'Prof. Ramesh Kumar', teacherRef: teacher._id, startTime: '10:00', endTime: '11:00', room: 'CS-101', type: 'lecture' },
            { periodNumber: 3, subject: 'Break',             teacher: 'N/A',                    startTime: '11:00', endTime: '11:15', type: 'break' },
            { periodNumber: 4, subject: 'OS Lab',            teacher: 'Prof. Suresh N.',    startTime: '11:15', endTime: '13:15', room: 'OS-Lab', type: 'lab' },
          ],
        },
        {
          day: 'Friday',
          periods: [
            { periodNumber: 1, subject: 'Computer Networks', teacher: 'Prof. Vikram S.',    startTime: '09:00', endTime: '10:00', room: 'CS-104', type: 'lecture' },
            { periodNumber: 2, subject: 'Web Development',   teacher: 'Prof. Anjali M.',    startTime: '10:00', endTime: '11:00', room: 'CS-102', type: 'lecture' },
            { periodNumber: 3, subject: 'Break',             teacher: 'N/A',                    startTime: '11:00', endTime: '11:15', type: 'break' },
            { periodNumber: 4, subject: 'Seminar / Guest Lecture', teacher: 'Various', startTime: '11:15', endTime: '12:15', room: 'Seminar Hall', type: 'lecture' },
          ],
        },
      ],
    });
    console.log('📅 Timetable created');

    // ── Notifications ─────────────────────────────────────────────────────
    await Notification.create([
      {
        title: 'Semester End Examinations Schedule Released',
        message: 'The schedule for Semester 4 end examinations has been released. Exams will commence from 20th December 2024. Hall tickets will be issued one week prior. Check the examination portal for detailed subject-wise schedule.',
        type: 'announcement',
        targetRole: 'student',
        pinned: true,
        createdBy: teacher._id,
        expiresAt: new Date('2024-12-31'),
      },
      {
        title: 'Fee Payment Deadline Reminder',
        message: 'This is a reminder that the last date for paying tuition fees for Semester 4 is 31st July 2024. Students who have not paid yet are requested to clear their dues immediately to avoid penalty charges.',
        type: 'warning',
        targetRole: 'student',
        pinned: true,
        createdBy: teacher._id,
      },
      {
        title: 'Library Hours Extended During Exams',
        message: 'The college library will be open from 7:00 AM to 10:00 PM during the examination period (15th Dec – 5th Jan). Students can borrow up to 5 books during this period. Late return fines will be waived for exam season.',
        type: 'info',
        targetRole: 'all',
        createdBy: teacher._id,
      },
      {
        title: 'Data Structures Assignment Deadline Extended',
        message: 'The deadline for the BST Implementation assignment has been extended by 3 days due to the upcoming cultural fest. New deadline: see tasks section. Ensure your code compiles and includes the required documentation.',
        type: 'info',
        targetRole: 'student',
        targetDepartment: 'Computer Science',
        targetSemester: 4,
        createdBy: teacher._id,
      },
      {
        title: 'Campus Wi-Fi Maintenance on Sunday',
        message: 'The campus network will be down for maintenance on Sunday, 24th November from 10:00 PM to 2:00 AM. Plan your online submissions and downloads accordingly.',
        type: 'warning',
        targetRole: 'all',
        createdBy: teacher._id,
        expiresAt: new Date(Date.now() + 5 * 86400000),
      },
      {
        title: 'Best Student Award Nominations Open',
        message: 'Nominations for the annual Best Student Award are now open. Faculty members can nominate deserving students through the online portal. Deadline for nominations: 10th December 2024.',
        type: 'success',
        targetRole: 'teacher',
        createdBy: teacher._id,
      },
    ]);
    console.log('🔔 Notifications created');

    // ── Summary ───────────────────────────────────────────────────────────
    console.log('\n✅ Seed completed successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Login Credentials:');
    console.log('  👨‍🏫 Teacher : teacher@college.edu / teacher123');
    studentsData.forEach(s => {
      console.log(`  🎓 Student : ${s.email} / student123  (${s.name})`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seed();
