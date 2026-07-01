// src/pages/teacher/FeesPage.js
import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';

const FEE_TYPES = ['tuition', 'hostel', 'library', 'exam', 'lab', 'sports', 'other'];
const PAYMENT_METHODS = ['cash', 'online', 'cheque', 'dd'];

const statusColor = { paid: 'badge-paid', pending: 'badge-pending', overdue: 'badge-overdue', partial: 'badge-late', waived: 'badge-present' };

export default function FeesPage() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [feeForm, setFeeForm] = useState({
    student: '', feeType: 'tuition', description: '',
    totalAmount: '', dueDate: '', semester: 1, academicYear: '2024-2025',
  });
  const [payForm, setPayForm] = useState({ amount: '', method: 'cash', transactionId: '', receiptNumber: '' });

  const fetchFees = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const [feesRes, statsRes] = await Promise.all([
        api.get(`/fees${params}`),
        api.get('/fees/stats'),
      ]);
      setFees(feesRes.data.data);
      setStats(statsRes.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchFees(); }, [fetchFees]);

  useEffect(() => {
    api.get('/students?limit=200').then(r => setStudents(r.data.data));
  }, []);

  const handleAddFee = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      await api.post('/fees', { ...feeForm, totalAmount: Number(feeForm.totalAmount), semester: Number(feeForm.semester) });
      setShowAddModal(false);
      setMsg('✅ Fee record created');
      fetchFees();
    } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Failed')); }
    finally { setSaving(false); }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/fees/${selectedFee._id}/pay`, { ...payForm, amount: Number(payForm.amount) });
      setShowPayModal(false);
      fetchFees();
    } catch (err) { alert(err.response?.data?.message || 'Payment failed'); }
    finally { setSaving(false); }
  };

  const openPayModal = (fee) => {
    setSelectedFee(fee);
    const balance = fee.totalAmount - (fee.payments?.reduce((s, p) => s + p.amount, 0) || 0) - (fee.waiver?.amount || 0);
    setPayForm({ amount: balance, method: 'cash', transactionId: '', receiptNumber: '' });
    setShowPayModal(true);
  };

  // Stats summary
  const statMap = {};
  stats.forEach(s => { statMap[s._id] = s; });
  const totalCollected = statMap['paid']?.totalAmount || 0;
  const totalPending = (statMap['pending']?.totalAmount || 0) + (statMap['partial']?.totalAmount || 0);
  const totalOverdue = statMap['overdue']?.totalAmount || 0;

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 style={{ fontWeight: 700, color: 'var(--primary)', margin: 0 }}>Fee Management</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>Track and manage student fee payments</p>
        </div>
        <button className="btn-primary-erp d-flex align-items-center gap-2" onClick={() => { setShowAddModal(true); setMsg(''); }}>
          <i className="bi bi-plus-circle"></i> Add Fee Record
        </button>
      </div>

      {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-danger'} py-2 px-3 mb-3`} style={{ fontSize: '0.85rem', borderRadius: 8 }}>{msg}</div>}

      {/* Stats Row */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Collected', value: `₹${totalCollected.toLocaleString('en-IN')}`, icon: 'bi-check-circle-fill', colorClass: 'stat-green' },
          { label: 'Pending Amount', value: `₹${totalPending.toLocaleString('en-IN')}`, icon: 'bi-hourglass-split', colorClass: 'stat-orange' },
          { label: 'Overdue Amount', value: `₹${totalOverdue.toLocaleString('en-IN')}`, icon: 'bi-exclamation-triangle-fill', colorClass: 'stat-red' },
          { label: 'Total Records', value: fees.length, icon: 'bi-receipt', colorClass: 'stat-blue' },
        ].map(s => (
          <div key={s.label} className="col-6 col-md-3">
            <div className={`stat-card ${s.colorClass}`}>
              <div className="stat-icon"><i className={`bi ${s.icon}`}></i></div>
              <div className="stat-value" style={{ fontSize: '1.4rem' }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter + Table */}
      <div className="erp-card">
        <div className="erp-card-header">
          <h5><i className="bi bi-cash-stack me-2" style={{ color: 'var(--accent)' }}></i>Fee Records</h5>
          <div className="d-flex gap-2">
            {['', 'pending', 'partial', 'paid', 'overdue'].map(s => (
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
                    <th>Fee Type</th>
                    <th>Total Amount</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Due Date</th>
                    <th>Sem / Year</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-5 text-muted">No fee records found</td></tr>
                  ) : fees.map(f => {
                    const paid = f.payments?.reduce((s, p) => s + p.amount, 0) + (f.waiver?.amount || 0);
                    const balance = Math.max(0, f.totalAmount - paid);
                    const isOverdue = new Date(f.dueDate) < new Date() && f.status !== 'paid';
                    return (
                      <tr key={f._id}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{f.student?.user?.name || '—'}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{f.student?.studentId}</div>
                        </td>
                        <td>
                          <span style={{ textTransform: 'capitalize', fontSize: '0.82rem', background: '#f0f4f8', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
                            {f.feeType}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>₹{f.totalAmount?.toLocaleString('en-IN')}</td>
                        <td style={{ color: 'var(--success)', fontWeight: 600 }}>₹{paid?.toLocaleString('en-IN')}</td>
                        <td style={{ color: balance > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>
                          ₹{balance?.toLocaleString('en-IN')}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: isOverdue ? 'var(--danger)' : 'inherit' }}>
                          {new Date(f.dueDate).toLocaleDateString('en-IN')}
                          {isOverdue && <span style={{ fontSize: '0.7rem', display: 'block', color: 'var(--danger)' }}>OVERDUE</span>}
                        </td>
                        <td style={{ fontSize: '0.82rem' }}>Sem {f.semester} / {f.academicYear}</td>
                        <td><span className={`status-badge ${statusColor[f.status] || ''}`}>{f.status}</span></td>
                        <td>
                          {f.status !== 'paid' && f.status !== 'waived' && (
                            <button onClick={() => openPayModal(f)} style={{
                              background: '#e6f7f0', color: 'var(--success)', border: 'none',
                              borderRadius: 6, padding: '5px 12px', fontSize: '0.78rem',
                              fontWeight: 600, cursor: 'pointer'
                            }}>
                              <i className="bi bi-cash me-1"></i>Pay
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

      {/* Add Fee Modal */}
      {showAddModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content" style={{ borderRadius: 16, border: 'none' }}>
              <div className="modal-header" style={{ background: 'var(--primary)', color: 'white', borderRadius: '16px 16px 0 0', border: 'none' }}>
                <h5 className="modal-title">Add Fee Record</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowAddModal(false)}></button>
              </div>
              <form onSubmit={handleAddFee}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Student *</label>
                      <select className="erp-input" required value={feeForm.student} onChange={e => setFeeForm({ ...feeForm, student: e.target.value })}>
                        <option value="">Select student...</option>
                        {students.map(s => <option key={s._id} value={s._id}>{s.user?.name} — {s.studentId}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Fee Type *</label>
                      <select className="erp-input" value={feeForm.feeType} onChange={e => setFeeForm({ ...feeForm, feeType: e.target.value })}>
                        {FEE_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Total Amount (₹) *</label>
                      <input className="erp-input" type="number" required min="1" value={feeForm.totalAmount} onChange={e => setFeeForm({ ...feeForm, totalAmount: e.target.value })} placeholder="e.g. 45000" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Due Date *</label>
                      <input className="erp-input" type="date" required value={feeForm.dueDate} onChange={e => setFeeForm({ ...feeForm, dueDate: e.target.value })} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Semester</label>
                      <select className="erp-input" value={feeForm.semester} onChange={e => setFeeForm({ ...feeForm, semester: e.target.value })}>
                        {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Academic Year</label>
                      <input className="erp-input" value={feeForm.academicYear} onChange={e => setFeeForm({ ...feeForm, academicYear: e.target.value })} placeholder="2024-2025" />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Description</label>
                      <input className="erp-input" value={feeForm.description} onChange={e => setFeeForm({ ...feeForm, description: e.target.value })} placeholder="Optional description" />
                    </div>
                  </div>
                </div>
                <div className="modal-footer" style={{ border: 'none' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary-erp" disabled={saving}>
                    {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : null}Create Fee Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && selectedFee && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content" style={{ borderRadius: 16, border: 'none' }}>
              <div className="modal-header" style={{ background: 'var(--success)', color: 'white', borderRadius: '16px 16px 0 0', border: 'none' }}>
                <h5 className="modal-title">Record Payment</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowPayModal(false)}></button>
              </div>
              <form onSubmit={handlePayment}>
                <div className="modal-body">
                  <div style={{ background: '#f0f4f8', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 4 }}>Fee Record</div>
                    <div style={{ fontWeight: 700 }}>{selectedFee.student?.user?.name} — {selectedFee.feeType}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Total: ₹{selectedFee.totalAmount?.toLocaleString('en-IN')} | Balance: ₹{payForm.amount?.toLocaleString?.('en-IN')}
                    </div>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Amount (₹) *</label>
                      <input className="erp-input" type="number" required min="1" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Payment Method</label>
                      <select className="erp-input" value={payForm.method} onChange={e => setPayForm({ ...payForm, method: e.target.value })}>
                        {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Transaction ID</label>
                      <input className="erp-input" value={payForm.transactionId} onChange={e => setPayForm({ ...payForm, transactionId: e.target.value })} placeholder="Optional" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Receipt No.</label>
                      <input className="erp-input" value={payForm.receiptNumber} onChange={e => setPayForm({ ...payForm, receiptNumber: e.target.value })} placeholder="Optional" />
                    </div>
                  </div>
                </div>
                <div className="modal-footer" style={{ border: 'none' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowPayModal(false)}>Cancel</button>
                  <button type="submit" className="btn-accent-erp" disabled={saving}>
                    {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check-circle me-2"></i>}Record Payment
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
