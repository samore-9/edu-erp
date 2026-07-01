// src/pages/teacher/TeacherDashboard.js
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../utils/api';

const StatCard = ({ icon, value, label, colorClass, change, changeType }) => (
  <div className={`stat-card ${colorClass}`}>
    <div className="stat-icon"><i className={`bi ${icon}`}></i></div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
    {change && (
      <div className={`stat-change ${changeType === 'up' ? 'text-success' : 'text-danger'}`}>
        <i className={`bi bi-arrow-${changeType} me-1`}></i>{change}
      </div>
    )}
  </div>
);

const PIE_COLORS = ['#2456a4', '#1a9e6a', '#e8a020', '#c0392b', '#7c3aed', '#0891b2'];

export default function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/teacher')
      .then(r => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="d-flex align-items-center justify-content-center" style={{ height: '60vh' }}>
      <div className="text-center">
        <div className="spinner-border" style={{ color: 'var(--primary-light)', width: 48, height: 48 }}></div>
        <div className="mt-3" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading dashboard...</div>
      </div>
    </div>
  );

  const stats = data?.stats || {};
  const feeSummary = data?.feeSummary || {};
  const deptData = data?.studentsByDepartment || [];
  const recentStudents = data?.recentStudents || [];

  const feeChartData = [
    { name: 'Collected', value: feeSummary.totalPaid || 0 },
    { name: 'Pending', value: feeSummary.totalDue || 0 },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 style={{ fontWeight: 700, color: 'var(--primary)', margin: 0 }}>Teacher Dashboard</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link to="/teacher/students" className="btn-primary-erp d-flex align-items-center gap-2">
          <i className="bi bi-person-plus"></i> Add Student
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <StatCard icon="bi-people-fill" value={stats.totalStudents ?? '—'} label="Total Students" colorClass="stat-blue" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="bi-calendar-check-fill" value={stats.attendanceToday ?? '—'} label="Attendance Today" colorClass="stat-green" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="bi-exclamation-triangle-fill" value={stats.feeDefaulters ?? '—'} label="Fee Defaulters" colorClass="stat-red" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="bi-book-fill" value={stats.overdueBooks ?? '—'} label="Overdue Books" colorClass="stat-orange" />
        </div>
      </div>

      {/* Charts Row */}
      <div className="row g-3 mb-4">
        {/* Students by Department */}
        <div className="col-lg-7">
          <div className="erp-card h-100">
            <div className="erp-card-header">
              <h5><i className="bi bi-bar-chart-fill me-2" style={{ color: 'var(--primary-light)' }}></i>Students by Department</h5>
            </div>
            <div className="erp-card-body">
              {deptData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={deptData} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                    <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#6b7e96' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7e96' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: '0.82rem', border: '1px solid var(--border)' }} />
                    <Bar dataKey="count" fill="var(--primary-light)" radius={[6, 6, 0, 0]} name="Students" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-4 text-muted">No department data available</div>
              )}
            </div>
          </div>
        </div>

        {/* Fee Status Pie */}
        <div className="col-lg-5">
          <div className="erp-card h-100">
            <div className="erp-card-header">
              <h5><i className="bi bi-pie-chart-fill me-2" style={{ color: 'var(--accent)' }}></i>Fee Collection</h5>
            </div>
            <div className="erp-card-body">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={feeChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {feeChartData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} contentStyle={{ borderRadius: 8, fontSize: '0.82rem' }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.8rem' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="d-flex justify-content-around mt-2">
                <div className="text-center">
                  <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1.1rem' }}>
                    ₹{(feeSummary.totalPaid || 0).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Collected</div>
                </div>
                <div className="text-center">
                  <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '1.1rem' }}>
                    ₹{(feeSummary.totalDue || 0).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Pending</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions + Recent Students */}
      <div className="row g-3">
        {/* Quick Actions */}
        <div className="col-lg-4">
          <div className="erp-card">
            <div className="erp-card-header"><h5>Quick Actions</h5></div>
            <div className="erp-card-body p-3">
              {[
                { to: '/teacher/attendance', icon: 'bi-calendar-check', label: 'Mark Attendance', color: '#e8f0fe', iconColor: 'var(--primary-light)' },
                { to: '/teacher/fees', icon: 'bi-cash-stack', label: 'Record Payment', color: '#e6f7f0', iconColor: 'var(--success)' },
                { to: '/teacher/tasks', icon: 'bi-journal-plus', label: 'Create Task', color: '#fef3e2', iconColor: 'var(--warning)' },
                { to: '/teacher/library', icon: 'bi-book-half', label: 'Issue Book', color: '#f0ebff', iconColor: '#7c3aed' },
              ].map(item => (
                <Link key={item.to} to={item.to} style={{ textDecoration: 'none' }}>
                  <div className="d-flex align-items-center gap-3 p-3 mb-2 rounded" style={{ background: item.color, transition: 'opacity 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                    <i className={`bi ${item.icon}`} style={{ color: item.iconColor, fontSize: '1.2rem' }}></i>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)' }}>{item.label}</span>
                    <i className="bi bi-chevron-right ms-auto" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}></i>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Students */}
        <div className="col-lg-8">
          <div className="erp-card">
            <div className="erp-card-header">
              <h5>Recent Students</h5>
              <Link to="/teacher/students" style={{ fontSize: '0.82rem', color: 'var(--primary-light)', textDecoration: 'none', fontWeight: 600 }}>
                View All <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </div>
            <div className="erp-card-body p-0">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>ID</th>
                    <th>Department</th>
                    <th>Semester</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentStudents.length === 0 ? (
                    <tr><td colSpan={5} className="text-center text-muted py-4">No students yet</td></tr>
                  ) : recentStudents.map(s => (
                    <tr key={s._id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-light)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                            {s.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.user?.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.8rem' }}>{s.studentId}</td>
                      <td style={{ fontSize: '0.82rem' }}>{s.department}</td>
                      <td><span style={{ background: '#e8f0fe', color: 'var(--primary-light)', padding: '2px 8px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600 }}>Sem {s.semester}</span></td>
                      <td><span className={`status-badge badge-${s.status === 'active' ? 'paid' : 'absent'}`}>{s.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
