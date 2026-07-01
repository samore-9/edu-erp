// src/pages/student/StudentDashboard.js
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../../utils/api';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/student')
      .then(r => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="d-flex align-items-center justify-content-center" style={{ height: '60vh' }}>
      <div className="text-center">
        <div className="spinner-border" style={{ color: 'var(--primary-light)', width: 48, height: 48 }}></div>
        <div className="mt-3" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading your dashboard...</div>
      </div>
    </div>
  );

  const { student, stats, attendanceBySubject, pendingFees, borrowedBooks, upcomingTasks } = data || {};

  const attendanceData = [{ name: 'Attendance', value: stats?.overallAttendance || 0, fill: stats?.overallAttendance >= 75 ? 'var(--success)' : 'var(--danger)' }];

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 24, color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '1px' }}>Welcome back</div>
          <h3 style={{ fontWeight: 800, margin: 0, fontSize: '1.7rem' }}>{student?.name} 👋</h3>
          <div style={{ opacity: 0.75, marginTop: 6, fontSize: '0.88rem' }}>
            {student?.department} • Sem {student?.semester} • ID: {student?.studentId}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{student?.cgpa?.toFixed(1) || '—'}</div>
            <div style={{ opacity: 0.7, fontSize: '0.78rem' }}>CGPA</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats?.overallAttendance || 0}%</div>
            <div style={{ opacity: 0.7, fontSize: '0.78rem' }}>Attendance</div>
          </div>
        </div>
      </div>

      {/* Low attendance alert */}
      {stats?.overallAttendance < 75 && stats?.overallAttendance > 0 && (
        <div className="alert-low-attendance mb-4">
          <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '1.1rem' }}></i>
          <div>
            <strong>Attendance Warning!</strong> Your overall attendance is {stats.overallAttendance}%, which is below the required 75%. Please attend classes regularly.
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Attendance', value: `${stats?.overallAttendance || 0}%`, icon: 'bi-calendar-check-fill', colorClass: 'stat-green', to: '/student/attendance' },
          { label: 'Pending Fees', value: stats?.pendingFeesCount || 0, icon: 'bi-cash-stack', colorClass: stats?.pendingFeesCount > 0 ? 'stat-red' : 'stat-green', to: '/student/fees' },
          { label: 'Books Borrowed', value: stats?.activeBorrowedBooks || 0, icon: 'bi-book-fill', colorClass: 'stat-blue', to: '/student/library' },
          { label: 'Pending Tasks', value: stats?.upcomingTasksCount || 0, icon: 'bi-journal-text', colorClass: 'stat-orange', to: '/student/tasks' },
        ].map(s => (
          <div key={s.label} className="col-6 col-md-3">
            <Link to={s.to} style={{ textDecoration: 'none' }}>
              <div className={`stat-card ${s.colorClass}`}>
                <div className="stat-icon"><i className={`bi ${s.icon}`}></i></div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <div className="row g-3 mb-4">
        {/* Attendance by Subject */}
        <div className="col-lg-7">
          <div className="erp-card h-100">
            <div className="erp-card-header">
              <h5><i className="bi bi-bar-chart me-2" style={{ color: 'var(--primary-light)' }}></i>Attendance by Subject</h5>
              <Link to="/student/attendance" style={{ fontSize: '0.82rem', color: 'var(--primary-light)', textDecoration: 'none', fontWeight: 600 }}>
                View All <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </div>
            <div className="erp-card-body">
              {!attendanceBySubject?.length ? (
                <div className="text-center py-4 text-muted">No attendance records yet</div>
              ) : attendanceBySubject.map(s => (
                <div key={s.subject} style={{ marginBottom: 16 }}>
                  <div className="d-flex justify-content-between mb-1">
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{s.subject}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: s.percentage >= 75 ? 'var(--success)' : s.percentage >= 60 ? 'var(--warning)' : 'var(--danger)' }}>
                      {s.percentage}% ({s.present}/{s.total})
                    </span>
                  </div>
                  <div style={{ background: '#f0f4f8', borderRadius: 50, height: 8, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 50,
                      width: `${s.percentage}%`,
                      background: s.percentage >= 75 ? 'var(--success)' : s.percentage >= 60 ? 'var(--warning)' : 'var(--danger)',
                      transition: 'width 0.8s ease',
                    }}></div>
                  </div>
                  {s.percentage < 75 && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--danger)', marginTop: 2 }}>
                      ⚠ Need {Math.ceil((0.75 * s.total - s.present) / (1 - 0.75))} more classes to reach 75%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fee Status */}
        <div className="col-lg-5">
          <div className="erp-card h-100">
            <div className="erp-card-header">
              <h5><i className="bi bi-cash-stack me-2" style={{ color: 'var(--accent)' }}></i>Pending Fees</h5>
              <Link to="/student/fees" style={{ fontSize: '0.82rem', color: 'var(--primary-light)', textDecoration: 'none', fontWeight: 600 }}>
                View All <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </div>
            <div className="erp-card-body p-0">
              {!pendingFees?.length ? (
                <div className="text-center py-5">
                  <i className="bi bi-check-circle-fill" style={{ fontSize: '2rem', color: 'var(--success)' }}></i>
                  <div style={{ marginTop: 8, fontWeight: 600, color: 'var(--success)' }}>All fees cleared!</div>
                </div>
              ) : pendingFees.map(f => (
                <div key={f._id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', textTransform: 'capitalize' }}>{f.feeType} Fee</div>
                    <div style={{ fontSize: '0.75rem', color: new Date(f.dueDate) < new Date() ? 'var(--danger)' : 'var(--text-muted)' }}>
                      Due: {new Date(f.dueDate).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'var(--danger)' }}>₹{f.totalAmount?.toLocaleString('en-IN')}</div>
                    <span className={`status-badge badge-${f.status}`}>{f.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        {/* Upcoming Tasks */}
        <div className="col-lg-6">
          <div className="erp-card">
            <div className="erp-card-header">
              <h5><i className="bi bi-journal-text me-2" style={{ color: '#7c3aed' }}></i>Upcoming Tasks</h5>
              <Link to="/student/tasks" style={{ fontSize: '0.82rem', color: 'var(--primary-light)', textDecoration: 'none', fontWeight: 600 }}>
                View All <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </div>
            <div className="erp-card-body p-0">
              {!upcomingTasks?.length ? (
                <div className="text-center py-4 text-muted">No upcoming tasks</div>
              ) : upcomingTasks.map(t => {
                const daysLeft = Math.ceil((new Date(t.dueDate) - new Date()) / 86400000);
                return (
                  <div key={t._id} style={{ padding: '13px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{t.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.subject}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: daysLeft <= 1 ? 'var(--danger)' : daysLeft <= 3 ? 'var(--warning)' : 'var(--text-muted)' }}>
                        {daysLeft === 0 ? 'Due Today!' : daysLeft === 1 ? 'Due Tomorrow' : `${daysLeft}d left`}
                      </div>
                      <span style={{ fontSize: '0.7rem', background: '#f0f4f8', padding: '2px 7px', borderRadius: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        {t.type}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Borrowed Books */}
        <div className="col-lg-6">
          <div className="erp-card">
            <div className="erp-card-header">
              <h5><i className="bi bi-book me-2" style={{ color: '#7c3aed' }}></i>Books Borrowed</h5>
              <Link to="/student/library" style={{ fontSize: '0.82rem', color: 'var(--primary-light)', textDecoration: 'none', fontWeight: 600 }}>
                View All <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </div>
            <div className="erp-card-body p-0">
              {!borrowedBooks?.length ? (
                <div className="text-center py-4">
                  <i className="bi bi-book" style={{ fontSize: '2rem', color: 'var(--border)' }}></i>
                  <div style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: '0.85rem' }}>No books currently borrowed</div>
                </div>
              ) : borrowedBooks.map(b => {
                const daysLeft = Math.ceil((new Date(b.dueDate) - new Date()) / 86400000);
                return (
                  <div key={b._id} style={{ padding: '13px 20px', borderBottom: '1px solid var(--border)' }}>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{b.bookTitle}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.author || 'Unknown author'}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: daysLeft < 0 ? 'var(--danger)' : daysLeft <= 2 ? 'var(--warning)' : 'var(--success)' }}>
                          {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                        </div>
                        {b.fine?.amount > 0 && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--danger)', fontWeight: 600 }}>Fine: ₹{b.fine.amount}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
