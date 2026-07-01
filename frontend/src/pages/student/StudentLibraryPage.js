// src/pages/student/StudentLibraryPage.js
import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function StudentLibraryPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    api.get('/students/me').then(async r => {
      const s = r.data.data;
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const { data } = await api.get(`/library/student/${s._id}${params}`);
      setRecords(data.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [statusFilter]);

  const activeBooks = records.filter(r => r.status === 'borrowed' || r.status === 'overdue');
  const returnedBooks = records.filter(r => r.status === 'returned');
  const totalFine = records.reduce((sum, r) => sum + (r.fine?.amount || 0), 0);

  if (loading) return <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary-light)' }}></div></div>;

  return (
    <div>
      <h4 style={{ fontWeight: 700, color: 'var(--primary)', margin: '0 0 24px' }}>Library</h4>

      {/* Stats */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Currently Borrowed', value: activeBooks.length, icon: 'bi-book-fill', colorClass: 'stat-blue' },
          { label: 'Books Returned', value: returnedBooks.length, icon: 'bi-check-circle-fill', colorClass: 'stat-green' },
          { label: 'Pending Fine', value: `₹${totalFine}`, icon: 'bi-exclamation-triangle', colorClass: totalFine > 0 ? 'stat-red' : 'stat-green' },
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

      {/* Currently Borrowed */}
      {activeBooks.length > 0 && (
        <div className="erp-card mb-4">
          <div className="erp-card-header">
            <h5><i className="bi bi-book me-2" style={{ color: 'var(--primary-light)' }}></i>Currently Borrowed</h5>
          </div>
          <div className="erp-card-body p-0">
            {activeBooks.map(r => {
              const daysLeft = Math.ceil((new Date(r.dueDate) - new Date()) / 86400000);
              const isOverdue = daysLeft < 0;
              return (
                <div key={r._id} style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 56, background: isOverdue ? '#fdecea' : '#e8f0fe', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="bi bi-book-fill" style={{ fontSize: '1.3rem', color: isOverdue ? 'var(--danger)' : 'var(--primary-light)' }}></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{r.bookTitle}</div>
                    {r.author && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>by {r.author}</div>}
                    {r.bookId && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono, monospace' }}>ID: {r.bookId}</div>}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Borrowed: {new Date(r.borrowedDate).toLocaleDateString('en-IN')}</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isOverdue ? 'var(--danger)' : daysLeft <= 3 ? 'var(--warning)' : 'var(--success)', marginTop: 2 }}>
                      {isOverdue ? `${Math.abs(daysLeft)} days OVERDUE` : `${daysLeft} days left`}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due: {new Date(r.dueDate).toLocaleDateString('en-IN')}</div>
                    {r.fine?.amount > 0 && <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--danger)' }}>Fine: ₹{r.fine.amount}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History */}
      <div className="erp-card">
        <div className="erp-card-header">
          <h5><i className="bi bi-clock-history me-2" style={{ color: '#7c3aed' }}></i>Borrowing History</h5>
          <select className="erp-input" style={{ width: 'auto', minWidth: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Records</option>
            {['borrowed', 'returned', 'overdue', 'lost'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="erp-card-body p-0">
          <div style={{ overflowX: 'auto' }}>
            <table className="erp-table">
              <thead>
                <tr><th>Book Title</th><th>Author</th><th>Borrowed</th><th>Due Date</th><th>Returned</th><th>Fine</th><th>Status</th></tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-4 text-muted">No borrowing history</td></tr>
                ) : records.map(r => (
                  <tr key={r._id}>
                    <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.bookTitle}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{r.author || '—'}</td>
                    <td style={{ fontSize: '0.82rem' }}>{new Date(r.borrowedDate).toLocaleDateString('en-IN')}</td>
                    <td style={{ fontSize: '0.82rem' }}>{new Date(r.dueDate).toLocaleDateString('en-IN')}</td>
                    <td style={{ fontSize: '0.82rem' }}>{r.returnedDate ? new Date(r.returnedDate).toLocaleDateString('en-IN') : '—'}</td>
                    <td style={{ fontWeight: 600, color: r.fine?.amount > 0 ? 'var(--danger)' : 'var(--success)' }}>₹{r.fine?.amount || 0}</td>
                    <td>
                      <span className={`status-badge ${r.status === 'returned' ? 'badge-paid' : r.status === 'overdue' ? 'badge-overdue' : r.status === 'borrowed' ? 'badge-pending' : 'badge-absent'}`}>
                        {r.status}
                      </span>
                    </td>
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
