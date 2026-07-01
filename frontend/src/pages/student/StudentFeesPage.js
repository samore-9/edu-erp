// src/pages/student/StudentFeesPage.js
import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function StudentFeesPage() {
  const [fees, setFees] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/students/me').then(async r => {
      const { data: feeData } = await api.get(`/fees/student/${r.data.data._id}`);
      setFees(feeData.data);
      setSummary(feeData.summary);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary-light)' }}></div></div>;

  return (
    <div>
      <h4 style={{ fontWeight: 700, color: 'var(--primary)', margin: '0 0 24px' }}>My Fees</h4>

      {/* Summary */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Due', value: `₹${summary.totalDue?.toLocaleString('en-IN') || 0}`, colorClass: 'stat-blue', icon: 'bi-receipt' },
          { label: 'Total Paid', value: `₹${summary.totalPaid?.toLocaleString('en-IN') || 0}`, colorClass: 'stat-green', icon: 'bi-check-circle-fill' },
          { label: 'Balance', value: `₹${summary.totalBalance?.toLocaleString('en-IN') || 0}`, colorClass: summary.totalBalance > 0 ? 'stat-red' : 'stat-green', icon: 'bi-wallet2' },
        ].map(s => (
          <div key={s.label} className="col-md-4">
            <div className={`stat-card ${s.colorClass}`}>
              <div className="stat-icon"><i className={`bi ${s.icon}`}></i></div>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Fee Records */}
      <div className="erp-card">
        <div className="erp-card-header"><h5><i className="bi bi-cash-stack me-2" style={{ color: 'var(--accent)' }}></i>Fee Details</h5></div>
        <div className="erp-card-body p-0">
          {fees.length === 0 ? (
            <div className="text-center py-5 text-muted">No fee records found</div>
          ) : fees.map(f => {
            const paid = f.payments?.reduce((s, p) => s + p.amount, 0) + (f.waiver?.amount || 0);
            const balance = Math.max(0, f.totalAmount - paid);
            const isOverdue = new Date(f.dueDate) < new Date() && f.status !== 'paid';
            return (
              <div key={f._id} style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', textTransform: 'capitalize' }}>{f.feeType} Fee</div>
                    {f.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{f.description}</div>}
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      Semester {f.semester} • {f.academicYear}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`status-badge badge-${f.status}`}>{f.status}</span>
                  </div>
                </div>

                <div className="row g-3 mt-2">
                  {[
                    { label: 'Total', value: `₹${f.totalAmount?.toLocaleString('en-IN')}`, color: 'var(--text)' },
                    { label: 'Paid', value: `₹${paid?.toLocaleString('en-IN')}`, color: 'var(--success)' },
                    { label: 'Balance', value: `₹${balance?.toLocaleString('en-IN')}`, color: balance > 0 ? 'var(--danger)' : 'var(--success)' },
                    { label: 'Due Date', value: new Date(f.dueDate).toLocaleDateString('en-IN'), color: isOverdue ? 'var(--danger)' : 'var(--text-muted)' },
                  ].map(item => (
                    <div key={item.label} className="col-6 col-md-3">
                      <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 12px' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{item.label}</div>
                        <div style={{ fontWeight: 700, color: item.color, marginTop: 2, fontSize: '0.9rem' }}>{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Payment history */}
                {f.payments?.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>PAYMENT HISTORY</div>
                    {f.payments.map((p, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '4px 0', borderBottom: '1px dashed #eef2f7' }}>
                        <span>{new Date(p.paidOn).toLocaleDateString('en-IN')} — {p.method}</span>
                        <span style={{ fontWeight: 600, color: 'var(--success)' }}>₹{p.amount?.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
