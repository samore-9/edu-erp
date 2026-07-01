// src/pages/teacher/StudentsPage.js
import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';

const DEPARTMENTS = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'MBA', 'MCA', 'Other'];
const EMPTY_FORM = {
  name: '', email: '', password: '', studentId: '', rollNumber: '',
  department: 'Computer Science', semester: 1, year: 1, batch: '', section: 'A',
  phone: '', gender: 'Male', cgpa: 0,
};

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [semFilter, setSemFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 15;

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (search) params.append('search', search);
      if (deptFilter) params.append('department', deptFilter);
      if (semFilter) params.append('semester', semFilter);
      const { data } = await api.get(`/students?${params}`);
      setStudents(data.data);
      setTotal(data.total);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, deptFilter, semFilter, page]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const openAdd = () => { setForm(EMPTY_FORM); setEditStudent(null); setError(''); setShowModal(true); };
  const openEdit = (s) => {
    setForm({
      name: s.user?.name || '', email: s.user?.email || '', password: '',
      studentId: s.studentId, rollNumber: s.rollNumber,
      department: s.department, semester: s.semester, year: s.year,
      batch: s.batch, section: s.section, phone: s.phone || '',
      gender: s.gender || 'Male', cgpa: s.cgpa || 0,
    });
    setEditStudent(s);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (editStudent) {
        await api.put(`/students/${editStudent._id}`, {
          rollNumber: form.rollNumber, department: form.department,
          semester: Number(form.semester), year: Number(form.year),
          batch: form.batch, section: form.section, phone: form.phone,
          gender: form.gender, cgpa: Number(form.cgpa),
        });
      } else {
        await api.post('/students', { ...form, semester: Number(form.semester), year: Number(form.year), cgpa: Number(form.cgpa) });
      }
      setShowModal(false);
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save student');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this student? This will deactivate their account.')) return;
    try {
      await api.delete(`/students/${id}`);
      fetchStudents();
    } catch (e) { alert('Failed to delete student'); }
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 style={{ fontWeight: 700, color: 'var(--primary)', margin: 0 }}>Students</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>{total} students enrolled</p>
        </div>
        <button className="btn-primary-erp d-flex align-items-center gap-2" onClick={openAdd}>
          <i className="bi bi-person-plus"></i> Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="erp-card mb-4">
        <div className="erp-card-body py-3">
          <div className="row g-2 align-items-center">
            <div className="col-md-4">
              <div style={{ position: 'relative' }}>
                <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
                <input className="erp-input" style={{ paddingLeft: 36 }} placeholder="Search by ID or Roll No..."
                  value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
              </div>
            </div>
            <div className="col-md-3">
              <select className="erp-input" value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1); }}>
                <option value="">All Departments</option>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <select className="erp-input" value={semFilter} onChange={e => { setSemFilter(e.target.value); setPage(1); }}>
                <option value="">All Semesters</option>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
              </select>
            </div>
            <div className="col-md-3 text-end">
              <button className="btn btn-sm btn-outline-secondary" onClick={() => { setSearch(''); setDeptFilter(''); setSemFilter(''); setPage(1); }}>
                <i className="bi bi-x-circle me-1"></i>Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="erp-card">
        <div className="erp-card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary-light)' }}></div></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Student ID</th>
                    <th>Roll No.</th>
                    <th>Department</th>
                    <th>Semester</th>
                    <th>Batch</th>
                    <th>CGPA</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-5 text-muted">No students found</td></tr>
                  ) : students.map(s => (
                    <tr key={s._id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-light), var(--primary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                            {s.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.user?.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.8rem', color: 'var(--primary-light)' }}>{s.studentId}</td>
                      <td style={{ fontSize: '0.82rem' }}>{s.rollNumber}</td>
                      <td style={{ fontSize: '0.82rem' }}>{s.department}</td>
                      <td><span style={{ background: '#e8f0fe', color: 'var(--primary-light)', padding: '3px 9px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600 }}>Sem {s.semester}</span></td>
                      <td style={{ fontSize: '0.82rem' }}>{s.batch}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: s.cgpa >= 8 ? 'var(--success)' : s.cgpa >= 6 ? 'var(--warning)' : 'var(--danger)', fontSize: '0.9rem' }}>
                          {s.cgpa?.toFixed(1) || '—'}
                        </span>
                      </td>
                      <td><span className={`status-badge badge-${s.status === 'active' ? 'paid' : 'absent'}`}>{s.status}</span></td>
                      <td>
                        <div className="d-flex gap-2">
                          <button onClick={() => openEdit(s)} className="btn btn-sm" style={{ background: '#e8f0fe', color: 'var(--primary-light)', border: 'none', borderRadius: 6, padding: '4px 10px' }}>
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button onClick={() => handleDelete(s._id)} className="btn btn-sm" style={{ background: '#fdecea', color: 'var(--danger)', border: 'none', borderRadius: 6, padding: '4px 10px' }}>
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="d-flex align-items-center justify-content-between px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
              </span>
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-outline-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <i className="bi bi-chevron-left"></i>
                </button>
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                  <button key={p} className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="btn btn-sm btn-outline-secondary" disabled={page === pages} onClick={() => setPage(p => p + 1)}>
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content" style={{ borderRadius: 16, border: 'none' }}>
              <div className="modal-header" style={{ background: 'var(--primary)', color: 'white', borderRadius: '16px 16px 0 0', border: 'none' }}>
                <h5 className="modal-title">{editStudent ? 'Edit Student' : 'Add New Student'}</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: '0.85rem' }}>{error}</div>}
                  <div className="row g-3">
                    {!editStudent && <>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Full Name *</label>
                        <input className="erp-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Student full name" />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Email *</label>
                        <input className="erp-input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="student@college.edu" />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Password *</label>
                        <input className="erp-input" type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Student ID *</label>
                        <input className="erp-input" required value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} placeholder="e.g. CS2024001" />
                      </div>
                    </>}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Roll Number *</label>
                      <input className="erp-input" required value={form.rollNumber} onChange={e => setForm({ ...form, rollNumber: e.target.value })} placeholder="e.g. 101" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Department *</label>
                      <select className="erp-input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                        {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Semester *</label>
                      <select className="erp-input" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })}>
                        {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Year *</label>
                      <select className="erp-input" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })}>
                        {[1,2,3,4].map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Section</label>
                      <input className="erp-input" value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} placeholder="A" />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>CGPA</label>
                      <input className="erp-input" type="number" step="0.1" min="0" max="10" value={form.cgpa} onChange={e => setForm({ ...form, cgpa: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Batch *</label>
                      <input className="erp-input" required value={form.batch} onChange={e => setForm({ ...form, batch: e.target.value })} placeholder="e.g. 2022-2026" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Phone</label>
                      <input className="erp-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 9999999999" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Gender</label>
                      <select className="erp-input" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                        {['Male','Female','Other'].map(g => <option key={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer" style={{ border: 'none' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary-erp" disabled={saving}>
                    {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : (editStudent ? 'Update Student' : 'Add Student')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
