// src/pages/teacher/LibraryPage.js
import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';

const statusColor = { borrowed: 'badge-pending', returned: 'badge-paid', overdue: 'badge-overdue', lost: 'badge-absent' };

export default function LibraryPage() {
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [form, setForm] = useState({
    student: '', bookTitle: '', author: '', isbn: '', bookId: '',
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    notes: '',
  });

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const { data } = await api.get(`/library${params}`);
      setRecords(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);
  useEffect(() => {
    api.get('/students?limit=200').then(r => setStudents(r.data.data));
  }, []);

  const handleIssue = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      await api.post('/library', form);
      setShowModal(false);
      setMsg('✅ Book issued successfully');
      fetchRecords();
      setForm({ student: '', bookTitle: '', author: '', isbn: '', bookId: '',
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0], notes: '' });
    } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Failed to issue book')); }
    finally { setSaving(false); }
  };

  const handleReturn = async (id) => {
    if (!window.confirm('Mark this book as returned?')) return;
    try {
      const { data } = await api.put(`/library/${id}/return`);
      setMsg('✅ ' + data.message);
      fetchRecords();
    } catch (e) { setMsg('❌ ' + (e.response?.data?.message || 'Failed')); }
  };

  const overdueCount = records.filter(r => r.status === 'overdue').length;
  const borrowedCount = records.filter(r => r.status === 'borrowed').length;

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 style={{ fontWeight: 700, color: 'var(--primary)', margin: 0 }}>Library</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>Manage book issuance and returns</p>
        </div>
        <button className="btn-primary-erp d-flex align-items-center gap-2" onClick={() => { setShowModal(true); setMsg(''); }}>
          <i className="bi bi-book-half"></i> Issue Book
        </button>
      </div>

      {msg && (
        <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-danger'} py-2 px-3 mb-3`} style={{ fontSize: '0.85rem', borderRadius: 8 }}>
          {msg}
        </div>
      )}

      {/* Stats */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Currently Borrowed', value: borrowedCount, icon: 'bi-book', colorClass: 'stat-blue' },
          { label: 'Overdue Books', value: overdueCount, icon: 'bi-exclamation-triangle-fill', colorClass: 'stat-red' },
          { label: 'Total Records', value: records.length, icon: 'bi-journal-bookmark', colorClass: 'stat-green' },
          { label: 'Returned Today', value: records.filter(r => r.status === 'returned' && new Date(r.returnedDate).toDateString() === new Date().toDateString()).length, icon: 'bi-check-circle', colorClass: 'stat-orange' },
        ].map(s => (
          <div key={s.label} className="col-6 col-md-3">
            <div className={`stat-card ${s.colorClass}`}>
              <div className="stat-icon"><i className={`bi ${s.icon}`}></i></div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="erp-card">
        <div className="erp-card-header">
          <h5><i className="bi bi-book me-2" style={{ color: '#7c3aed' }}></i>Library Records</h5>
          <div className="d-flex gap-2">
            {['', 'borrowed', 'overdue', 'returned', 'lost'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{
                padding: '5px 14px', borderRadius: 20, border: 'none', fontSize: '0.78rem', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'Sora, sans-serif',
                background: statusFilter === s ? 'var(--primary-light)' : '#f0f4f8',
                color: statusFilter === s ? 'white' : 'var(--text-muted)',
              }}>
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>
        <div className="erp-card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary-light)' }}></div></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Book Title</th>
                    <th>Author</th>
                    <th>Book ID</th>
                    <th>Issued On</th>
                    <th>Due Date</th>
                    <th>Returned</th>
                    <th>Fine (₹)</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr><td colSpan={10} className="text-center py-5 text-muted">No library records found</td></tr>
                  ) : records.map(r => {
                    const isOverdue = r.status === 'overdue';
                    const daysLeft = r.status !== 'returned' ? Math.ceil((new Date(r.dueDate) - new Date()) / 86400000) : null;
                    return (
                      <tr key={r._id}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.student?.user?.name || '—'}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.student?.studentId}</div>
                        </td>
                        <td style={{ fontWeight: 600, fontSize: '0.85rem', maxWidth: 160 }}>{r.bookTitle}</td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{r.author || '—'}</td>
                        <td style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.8rem' }}>{r.bookId || r.isbn || '—'}</td>
                        <td style={{ fontSize: '0.82rem' }}>{new Date(r.borrowedDate).toLocaleDateString('en-IN')}</td>
                        <td style={{ fontSize: '0.82rem', color: isOverdue ? 'var(--danger)' : 'inherit', fontWeight: isOverdue ? 700 : 400 }}>
                          {new Date(r.dueDate).toLocaleDateString('en-IN')}
                          {daysLeft !== null && r.status !== 'returned' && (
                            <div style={{ fontSize: '0.7rem', color: daysLeft < 0 ? 'var(--danger)' : daysLeft <= 2 ? 'var(--warning)' : 'var(--success)' }}>
                              {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: '0.82rem' }}>{r.returnedDate ? new Date(r.returnedDate).toLocaleDateString('en-IN') : '—'}</td>
                        <td style={{ fontWeight: 700, color: r.fine?.amount > 0 ? 'var(--danger)' : 'var(--success)' }}>
                          ₹{r.fine?.amount || 0}
                        </td>
                        <td><span className={`status-badge ${statusColor[r.status] || ''}`}>{r.status}</span></td>
                        <td>
                          {(r.status === 'borrowed' || r.status === 'overdue') && (
                            <button onClick={() => handleReturn(r._id)} style={{
                              background: '#e6f7f0', color: 'var(--success)', border: 'none',
                              borderRadius: 6, padding: '5px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer'
                            }}>
                              <i className="bi bi-arrow-return-left me-1"></i>Return
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Issue Book Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content" style={{ borderRadius: 16, border: 'none' }}>
              <div className="modal-header" style={{ background: 'var(--primary)', color: 'white', borderRadius: '16px 16px 0 0', border: 'none' }}>
                <h5 className="modal-title"><i className="bi bi-book-half me-2"></i>Issue Book</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleIssue}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Student *</label>
                      <select className="erp-input" required value={form.student} onChange={e => setForm({ ...form, student: e.target.value })}>
                        <option value="">Select student...</option>
                        {students.map(s => <option key={s._id} value={s._id}>{s.user?.name} — {s.studentId}</option>)}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Book Title *</label>
                      <input className="erp-input" required value={form.bookTitle} onChange={e => setForm({ ...form, bookTitle: e.target.value })} placeholder="e.g. Introduction to Algorithms" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Author</label>
                      <input className="erp-input" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} placeholder="Author name" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Book ID / Accession No.</label>
                      <input className="erp-input" value={form.bookId} onChange={e => setForm({ ...form, bookId: e.target.value })} placeholder="LIB-001" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>ISBN</label>
                      <input className="erp-input" value={form.isbn} onChange={e => setForm({ ...form, isbn: e.target.value })} placeholder="978-XXXXXXXXXX" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Due Date *</label>
                      <input className="erp-input" type="date" required value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Notes</label>
                      <input className="erp-input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
                    </div>
                  </div>
                </div>
                <div className="modal-footer" style={{ border: 'none' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary-erp" disabled={saving}>
                    {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-book me-2"></i>}Issue Book
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
