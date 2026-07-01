// src/pages/student/StudentAttendancePage.js
import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function StudentAttendancePage() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState('');

  useEffect(() => {
    api.get('/students/me').then(async (r) => {
      const s = r.data.data;
      setProfile(s);
      const att = await api.get(`/attendance/student/${s._id}`);
      setRecords(att.data.data);
      setSummary(att.data.summary);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const subjects = [...new Set(records.map(r => r.subject))];
  const filtered = subjectFilter ? records.filter(r => r.subject === subjectFilter) : records;

  const statusIcon = { present: '✅', absent: '❌', late: '⏰', excused: '📋' };

  if (loading) return <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary-light)' }}></div></div>;

  return (
    <div>
      <h4 style={{ fontWeight: 700, color: 'var(--primary)', margin: '0 0 24px' }}>My Attendance</h4>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        {summary.length === 0 ? (
          <div className="col-12"><div className="erp-card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No attendance records found.</div></div>
        ) : summary.map(s => (
          <div key={s.subject} className="col-md-4 col-lg-3">
            <div className="erp-card" style={{ padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.9rem', color: 'var(--primary)' }}>{s.subject}</div>
              <div style={{
                fontSize: '2.2rem', fontWeight: 800,
                color: s.percentage >= 75 ? 'var(--success)' : s.percentage >= 60 ? 'var(--warning)' : 'var(--danger)'
              }}>
                {s.percentage}%
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.present} present / {s.total} total</div>

              {/* Progress bar */}
              <div style={{ background: '#f0f4f8', borderRadius: 50, height: 6, marginTop: 10, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 50, width: `${s.percentage}%`,
                  background: s.percentage >= 75 ? 'var(--success)' : s.percentage >= 60 ? 'var(--warning)' : 'var(--danger)',
                }}></div>
              </div>

              {s.percentage < 75 && (
                <div style={{ marginTop: 8, fontSize: '0.72rem', color: 'var(--danger)', fontWeight: 600 }}>
                  ⚠ {Math.max(0, Math.ceil((0.75 * s.total - s.present) / 0.25))} more classes needed
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Filter + Records */}
      <div className="erp-card">
        <div className="erp-card-header">
          <h5>Attendance Records</h5>
          <select className="erp-input" style={{ width: 'auto', minWidth: 180 }} value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}>
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="erp-card-body p-0">
          <div style={{ overflowX: 'auto' }}>
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-4 text-muted">No records found</td></tr>
                ) : filtered.map(r => (
                  <tr key={r._id}>
                    <td style={{ fontSize: '0.85rem' }}>
                      {new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.subject}</td>
                    <td>
                      <span className={`status-badge badge-${r.status}`}>
                        {statusIcon[r.status]} {r.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{r.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
