// src/pages/teacher/AttendancePage.js
import { useState, useEffect } from 'react';
import api from '../../utils/api';

const DEPARTMENTS = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'MBA', 'MCA'];

export default function AttendancePage() {
  const [tab, setTab] = useState('mark'); // 'mark' | 'report'
  const [dept, setDept] = useState('Computer Science');
  const [semester, setSemester] = useState(4);
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  // Report state
  const [reportStudentId, setReportStudentId] = useState('');
  const [reportData, setReportData] = useState(null);
  const [allStudents, setAllStudents] = useState([]);

  useEffect(() => {
    api.get(`/students?department=${dept}&semester=${semester}&limit=100`)
      .then(r => {
        setStudents(r.data.data);
        // default all present
        const init = {};
        r.data.data.forEach(s => { init[s._id] = 'present'; });
        setAttendance(init);
      });
    api.get('/students?limit=200').then(r => setAllStudents(r.data.data));
  }, [dept, semester]);

  const handleBulkMark = async () => {
    if (!subject) return setMsg('Please enter a subject');
    setSubmitting(true); setMsg('');
    try {
      const records = students.map(s => ({ studentId: s._id, status: attendance[s._id] || 'absent' }));
      await api.post('/attendance/bulk', { records, subject, date, department: dept, semester });
      setMsg(`✅ Attendance marked for ${records.length} students`);
    } catch (e) {
      setMsg('❌ ' + (e.response?.data?.message || 'Failed to mark attendance'));
    } finally { setSubmitting(false); }
  };

  const fetchReport = async () => {
    if (!reportStudentId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/attendance/student/${reportStudentId}`);
      setReportData(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach(s => { updated[s._id] = status; });
    setAttendance(updated);
  };

  const presentCount = Object.values(attendance).filter(v => v === 'present').length;

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 style={{ fontWeight: 700, color: 'var(--primary)', margin: 0 }}>Attendance</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>Mark and track student attendance</p>
        </div>
        <div className="d-flex gap-2">
          {['mark', 'report'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', fontFamily: 'Sora, sans-serif',
              fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
              background: tab === t ? 'var(--primary-light)' : 'white',
              color: tab === t ? 'white' : 'var(--text-muted)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
            }}>
              <i className={`bi ${t === 'mark' ? 'bi-calendar-check' : 'bi-bar-chart'} me-2`}></i>
              {t === 'mark' ? 'Mark Attendance' : 'View Report'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'mark' && (
        <>
          {/* Filters */}
          <div className="erp-card mb-4">
            <div className="erp-card-header"><h5>Class & Date Selection</h5></div>
            <div className="erp-card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Department</label>
                  <select className="erp-input" value={dept} onChange={e => setDept(e.target.value)}>
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Semester</label>
                  <select className="erp-input" value={semester} onChange={e => setSemester(Number(e.target.value))}>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Subject *</label>
                  <input className="erp-input" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Data Structures" />
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Date</label>
                  <input type="date" className="erp-input" value={date} onChange={e => setDate(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Student List */}
          <div className="erp-card">
            <div className="erp-card-header">
              <h5>
                <i className="bi bi-people me-2"></i>
                {students.length} Students — <span style={{ color: 'var(--success)' }}>{presentCount} Present</span> / <span style={{ color: 'var(--danger)' }}>{students.length - presentCount} Absent</span>
              </h5>
              <div className="d-flex gap-2">
                <button onClick={() => markAll('present')} className="btn btn-sm" style={{ background: '#e6f7f0', color: 'var(--success)', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: '0.8rem' }}>
                  ✓ All Present
                </button>
                <button onClick={() => markAll('absent')} className="btn btn-sm" style={{ background: '#fdecea', color: 'var(--danger)', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: '0.8rem' }}>
                  ✗ All Absent
                </button>
              </div>
            </div>
            <div className="erp-card-body p-0">
              {students.length === 0 ? (
                <div className="text-center py-5 text-muted">No students in this class</div>
              ) : (
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student</th>
                      <th>Roll No.</th>
                      <th>Present</th>
                      <th>Late</th>
                      <th>Absent</th>
                      <th>Excused</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={s._id}>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.user?.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.studentId}</div>
                        </td>
                        <td style={{ fontSize: '0.82rem' }}>{s.rollNumber}</td>
                        {['present', 'late', 'absent', 'excused'].map(status => (
                          <td key={status}>
                            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <input type="radio" name={`att-${s._id}`} value={status}
                                checked={attendance[s._id] === status}
                                onChange={() => setAttendance({ ...attendance, [s._id]: status })}
                                style={{ accentColor: status === 'present' ? 'var(--success)' : status === 'absent' ? 'var(--danger)' : status === 'late' ? 'var(--warning)' : 'var(--info)', width: 16, height: 16 }}
                              />
                            </label>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {students.length > 0 && (
              <div className="p-4 d-flex align-items-center justify-content-between" style={{ borderTop: '1px solid var(--border)' }}>
                {msg && (
                  <div style={{ fontSize: '0.85rem', color: msg.startsWith('✅') ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{msg}</div>
                )}
                <button className="btn-primary-erp ms-auto" onClick={handleBulkMark} disabled={submitting}>
                  {submitting ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : <><i className="bi bi-check-circle me-2"></i>Submit Attendance</>}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'report' && (
        <div className="erp-card">
          <div className="erp-card-header"><h5>Attendance Report by Student</h5></div>
          <div className="erp-card-body">
            <div className="row g-3 mb-4">
              <div className="col-md-5">
                <select className="erp-input" value={reportStudentId} onChange={e => setReportStudentId(e.target.value)}>
                  <option value="">Select a student...</option>
                  {allStudents.map(s => (
                    <option key={s._id} value={s._id}>{s.user?.name} — {s.studentId}</option>
                  ))}
                </select>
              </div>
              <div className="col-auto">
                <button className="btn-primary-erp" onClick={fetchReport} disabled={!reportStudentId || loading}>
                  {loading ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-search me-1"></i>Fetch Report</>}
                </button>
              </div>
            </div>

            {reportData && (
              <>
                {/* Summary */}
                <div className="row g-3 mb-4">
                  {reportData.summary.map(s => (
                    <div key={s.subject} className="col-md-3">
                      <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '16px', border: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 4 }}>{s.subject}</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 700, color: s.percentage >= 75 ? 'var(--success)' : s.percentage >= 60 ? 'var(--warning)' : 'var(--danger)' }}>
                          {s.percentage}%
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.present}/{s.total} classes</div>
                        {s.percentage < 75 && (
                          <div style={{ marginTop: 6, fontSize: '0.72rem', color: 'var(--danger)', fontWeight: 600 }}>⚠ Below 75%</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Records table */}
                <table className="erp-table">
                  <thead>
                    <tr><th>Date</th><th>Subject</th><th>Status</th><th>Marked By</th><th>Remarks</th></tr>
                  </thead>
                  <tbody>
                    {reportData.data.map(r => (
                      <tr key={r._id}>
                        <td style={{ fontSize: '0.82rem' }}>{new Date(r.date).toLocaleDateString('en-IN')}</td>
                        <td style={{ fontSize: '0.82rem' }}>{r.subject}</td>
                        <td><span className={`status-badge badge-${r.status}`}>{r.status}</span></td>
                        <td style={{ fontSize: '0.82rem' }}>{r.markedBy?.name}</td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{r.remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
