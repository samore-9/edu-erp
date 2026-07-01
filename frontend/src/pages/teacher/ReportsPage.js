// src/pages/teacher/ReportsPage.js
import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../../utils/api';

const DEPARTMENTS = ['', 'Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'MBA', 'MCA'];
const COLORS = ['#2456a4', '#1a9e6a', '#e8a020', '#c0392b', '#7c3aed', '#0891b2', '#be185d', '#b45309'];

const riskColor = { HIGH: '#fdecea', MEDIUM: '#fef3e2', LOW: '#e6f7f0' };
const riskText  = { HIGH: 'var(--danger)', MEDIUM: 'var(--warning)', LOW: 'var(--success)' };

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('attendance');
  const [department, setDepartment] = useState('');
  const [semester, setSemester]   = useState('');
  const [academicYear, setAcademicYear] = useState('2024-2025');
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const TABS = [
    { id: 'attendance',  label: 'Attendance',   icon: 'bi-calendar-check' },
    { id: 'fees',        label: 'Fees',          icon: 'bi-cash-stack' },
    { id: 'performance', label: 'Performance',   icon: 'bi-graph-up' },
    { id: 'library',     label: 'Library',       icon: 'bi-book' },
  ];

  const fetchReport = async () => {
    setLoading(true); setError(''); setData(null);
    try {
      let url = `/reports/${activeTab}?`;
      if (department) url += `department=${encodeURIComponent(department)}&`;
      if (semester)   url += `semester=${semester}&`;
      if (activeTab === 'fees' && academicYear) url += `academicYear=${academicYear}&`;
      const { data: res } = await api.get(url);
      setData(res);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to generate report');
    } finally { setLoading(false); }
  };

  const downloadCSV = async () => {
    try {
      let url = `/reports/${activeTab}?format=csv`;
      if (department) url += `&department=${encodeURIComponent(department)}`;
      if (semester)   url += `&semester=${semester}`;
      if (activeTab === 'fees' && academicYear) url += `&academicYear=${academicYear}`;
      const res = await api.get(url);
      const blob = new Blob([res.data], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${activeTab}_report.csv`;
      link.click();
    } catch (e) { alert('CSV export failed'); }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 style={{ fontWeight: 700, color: 'var(--primary)', margin: 0 }}>Reports & Analytics</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
            Generate and export detailed reports
          </p>
        </div>
        {data && (activeTab === 'attendance' || activeTab === 'fees') && (
          <button className="btn-accent-erp d-flex align-items-center gap-2" onClick={downloadCSV}>
            <i className="bi bi-download"></i> Export CSV
          </button>
        )}
      </div>

      {/* Tab Bar */}
      <div className="d-flex gap-2 mb-4 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id); setData(null); }} style={{
            padding: '9px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '0.85rem',
            background: activeTab === t.id ? 'var(--primary)' : 'white',
            color: activeTab === t.id ? 'white' : 'var(--text-muted)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}>
            <i className={`bi ${t.icon} me-2`}></i>{t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="erp-card mb-4">
        <div className="erp-card-body py-3">
          <div className="row g-3 align-items-end">
            {(activeTab !== 'library') && (
              <div className="col-md-3">
                <label className="form-label fw-semibold" style={{ fontSize: '0.8rem' }}>Department</label>
                <select className="erp-input" value={department} onChange={e => setDepartment(e.target.value)}>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d || 'All Departments'}</option>)}
                </select>
              </div>
            )}
            {(activeTab === 'attendance' || activeTab === 'performance') && (
              <div className="col-md-2">
                <label className="form-label fw-semibold" style={{ fontSize: '0.8rem' }}>Semester</label>
                <select className="erp-input" value={semester} onChange={e => setSemester(e.target.value)}>
                  <option value="">All</option>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                </select>
              </div>
            )}
            {activeTab === 'fees' && (
              <div className="col-md-3">
                <label className="form-label fw-semibold" style={{ fontSize: '0.8rem' }}>Academic Year</label>
                <input className="erp-input" value={academicYear} onChange={e => setAcademicYear(e.target.value)} placeholder="2024-2025" />
              </div>
            )}
            <div className="col-auto">
              <button className="btn-primary-erp" onClick={fetchReport} disabled={loading}>
                {loading
                  ? <><span className="spinner-border spinner-border-sm me-2"></span>Generating...</>
                  : <><i className="bi bi-graph-up me-2"></i>Generate Report</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2 px-3 mb-4" style={{ fontSize: '0.85rem', borderRadius: 8 }}>{error}</div>}

      {/* ─── ATTENDANCE REPORT ─────────────────────────────────── */}
      {activeTab === 'attendance' && data && (
        <>
          {/* KPIs */}
          <div className="row g-3 mb-4">
            {[
              { label: 'Total Students', value: data.count, colorClass: 'stat-blue', icon: 'bi-people' },
              { label: 'Below 75%', value: data.lowAttendance, colorClass: 'stat-red', icon: 'bi-exclamation-triangle' },
              { label: 'Above 75%', value: data.count - data.lowAttendance, colorClass: 'stat-green', icon: 'bi-check-circle' },
            ].map(s => (
              <div key={s.label} className="col-md-4">
                <div className={`stat-card ${s.colorClass}`}>
                  <div className="stat-icon"><i className={`bi ${s.icon}`}></i></div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="erp-card mb-4">
            <div className="erp-card-header"><h5>Attendance Distribution</h5></div>
            <div className="erp-card-body">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.data.slice(0, 20)} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7e96' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={v => `${v}%`} contentStyle={{ borderRadius: 8, fontSize: '0.82rem' }} />
                  <Bar dataKey="percentage" name="Attendance %" radius={[5,5,0,0]}
                    fill="var(--primary-light)"
                    label={{ position: 'top', fontSize: 10, fill: '#6b7e96', formatter: v => `${v}%` }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div className="erp-card">
            <div className="erp-card-header"><h5>Student Attendance Details</h5></div>
            <div className="erp-card-body p-0" style={{ overflowX: 'auto' }}>
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Student ID</th><th>Name</th><th>Department</th><th>Sem</th>
                    <th>Total</th><th>Present</th><th>Absent</th><th>Late</th><th>%</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map(s => (
                    <tr key={s.studentId}>
                      <td style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.8rem', color: 'var(--primary-light)' }}>{s.studentId}</td>
                      <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.name}</td>
                      <td style={{ fontSize: '0.82rem' }}>{s.department}</td>
                      <td>{s.semester}</td>
                      <td>{s.total}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>{s.present}</td>
                      <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{s.absent}</td>
                      <td style={{ color: 'var(--warning)', fontWeight: 600 }}>{s.late}</td>
                      <td>
                        <span style={{
                          fontWeight: 800, fontSize: '0.9rem',
                          color: s.percentage >= 75 ? 'var(--success)' : s.percentage >= 60 ? 'var(--warning)' : 'var(--danger)',
                        }}>
                          {s.percentage}%
                        </span>
                      </td>
                      <td>
                        <span style={{
                          padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                          background: s.status === 'OK' ? '#e6f7f0' : '#fdecea',
                          color: s.status === 'OK' ? 'var(--success)' : 'var(--danger)',
                        }}>
                          {s.status === 'OK' ? '✓ OK' : '⚠ LOW'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ─── FEES REPORT ──────────────────────────────────────── */}
      {activeTab === 'fees' && data && (
        <>
          <div className="row g-3 mb-4">
            {[
              { label: 'Total Due', value: `₹${data.totals?.totalDue?.toLocaleString('en-IN')}`, colorClass: 'stat-blue', icon: 'bi-receipt' },
              { label: 'Total Collected', value: `₹${data.totals?.totalPaid?.toLocaleString('en-IN')}`, colorClass: 'stat-green', icon: 'bi-check-circle' },
              { label: 'Outstanding', value: `₹${data.totals?.totalBalance?.toLocaleString('en-IN')}`, colorClass: 'stat-red', icon: 'bi-exclamation-triangle' },
              { label: 'Records', value: data.count, colorClass: 'stat-orange', icon: 'bi-list-ul' },
            ].map(s => (
              <div key={s.label} className="col-6 col-md-3">
                <div className={`stat-card ${s.colorClass}`}>
                  <div className="stat-icon"><i className={`bi ${s.icon}`}></i></div>
                  <div className="stat-value" style={{ fontSize: '1.3rem' }}>{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="erp-card">
            <div className="erp-card-header"><h5>Fee Records</h5></div>
            <div className="erp-card-body p-0" style={{ overflowX: 'auto' }}>
              <table className="erp-table">
                <thead>
                  <tr><th>Student ID</th><th>Name</th><th>Dept</th><th>Sem</th><th>Type</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {data.data.map((f, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.8rem', color: 'var(--primary-light)' }}>{f.studentId}</td>
                      <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{f.name}</td>
                      <td style={{ fontSize: '0.82rem' }}>{f.department}</td>
                      <td>{f.semester}</td>
                      <td style={{ textTransform: 'capitalize', fontSize: '0.82rem' }}>{f.feeType}</td>
                      <td style={{ fontWeight: 600 }}>₹{f.totalAmount?.toLocaleString('en-IN')}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>₹{f.paidAmount?.toLocaleString('en-IN')}</td>
                      <td style={{ color: f.balance > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>₹{f.balance?.toLocaleString('en-IN')}</td>
                      <td><span className={`status-badge badge-${f.status}`}>{f.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ─── PERFORMANCE REPORT ───────────────────────────────── */}
      {activeTab === 'performance' && data && (
        <>
          <div className="row g-3 mb-4">
            {[
              { label: 'Total Students', value: data.count, colorClass: 'stat-blue', icon: 'bi-people' },
              { label: 'High Risk', value: data.highRisk, colorClass: 'stat-red', icon: 'bi-exclamation-octagon' },
              { label: 'On Track', value: data.count - data.highRisk, colorClass: 'stat-green', icon: 'bi-shield-check' },
            ].map(s => (
              <div key={s.label} className="col-md-4">
                <div className={`stat-card ${s.colorClass}`}>
                  <div className="stat-icon"><i className={`bi ${s.icon}`}></i></div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="erp-card">
            <div className="erp-card-header"><h5>Student Performance Overview</h5></div>
            <div className="erp-card-body p-0" style={{ overflowX: 'auto' }}>
              <table className="erp-table">
                <thead>
                  <tr><th>Student ID</th><th>Name</th><th>Dept</th><th>Sem</th><th>CGPA</th><th>Attendance</th><th>Pending Fees</th><th>Overdue Books</th><th>Risk</th></tr>
                </thead>
                <tbody>
                  {data.data.map(s => (
                    <tr key={s.studentId}>
                      <td style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.8rem', color: 'var(--primary-light)' }}>{s.studentId}</td>
                      <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.name}</td>
                      <td style={{ fontSize: '0.82rem' }}>{s.department}</td>
                      <td>{s.semester}</td>
                      <td style={{ fontWeight: 700, color: s.cgpa >= 8 ? 'var(--success)' : s.cgpa >= 6 ? 'var(--warning)' : 'var(--danger)' }}>{s.cgpa?.toFixed(1)}</td>
                      <td style={{ fontWeight: 700, color: s.attendance >= 75 ? 'var(--success)' : 'var(--danger)' }}>{s.attendance}%</td>
                      <td style={{ color: s.pendingFees > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>{s.pendingFees}</td>
                      <td style={{ color: s.overdueBooks > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>{s.overdueBooks}</td>
                      <td>
                        <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: riskColor[s.riskLevel], color: riskText[s.riskLevel] }}>
                          {s.riskLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ─── LIBRARY REPORT ────────────────────────────────────── */}
      {activeTab === 'library' && data && (
        <div className="row g-3">
          <div className="col-lg-5">
            <div className="erp-card mb-3">
              <div className="erp-card-header"><h5>Books by Status</h5></div>
              <div className="erp-card-body">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={data.data.byStatus} cx="50%" cy="50%" outerRadius={80} dataKey="count" nameKey="_id" paddingAngle={3}>
                      {data.data.byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: '0.82rem' }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.8rem' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="erp-card">
              <div className="erp-card-header"><h5>Fine Summary</h5></div>
              <div className="erp-card-body">
                <div className="row g-3">
                  {[
                    { label: 'Total Fine Accrued', value: `₹${data.data.fines?.totalFine || 0}`, color: 'var(--danger)' },
                    { label: 'Fine Collected', value: `₹${data.data.fines?.paidFine || 0}`, color: 'var(--success)' },
                  ].map(item => (
                    <div key={item.label} className="col-6">
                      <div style={{ background: '#f8fafc', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: '1.4rem', color: item.color }}>{item.value}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{item.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-7">
            <div className="erp-card">
              <div className="erp-card-header"><h5>Top Borrowers</h5></div>
              <div className="erp-card-body p-0">
                <table className="erp-table">
                  <thead><tr><th>#</th><th>Student</th><th>Student ID</th><th>Books Borrowed</th><th>Total Fine</th></tr></thead>
                  <tbody>
                    {data.data.topBorrowers.map((s, i) => (
                      <tr key={s.studentId}>
                        <td style={{ color: 'var(--text-muted)', fontWeight: 700 }}>#{i + 1}</td>
                        <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.name}</td>
                        <td style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.8rem', color: 'var(--primary-light)' }}>{s.studentId}</td>
                        <td style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{s.count}</td>
                        <td style={{ fontWeight: 600, color: s.totalFine > 0 ? 'var(--danger)' : 'var(--success)' }}>₹{s.totalFine}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state before generating */}
      {!data && !loading && (
        <div className="erp-card" style={{ textAlign: 'center', padding: '70px 20px' }}>
          <i className="bi bi-graph-up-arrow" style={{ fontSize: '3.5rem', color: 'var(--border)' }}></i>
          <h5 style={{ color: 'var(--text-muted)', marginTop: 16, fontWeight: 600 }}>Configure filters and click Generate Report</h5>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Reports are generated live from your database — no stale data.
          </p>
        </div>
      )}
    </div>
  );
}
