// src/pages/teacher/NotificationsPage.js
import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';

const DEPARTMENTS = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'MBA', 'MCA'];
const TYPE_META = {
  info:         { label: 'Info',         color: 'var(--info)',    bg: '#e8f4fe', icon: 'bi-info-circle-fill' },
  warning:      { label: 'Warning',      color: 'var(--warning)', bg: '#fef3e2', icon: 'bi-exclamation-triangle-fill' },
  success:      { label: 'Success',      color: 'var(--success)', bg: '#e6f7f0', icon: 'bi-check-circle-fill' },
  danger:       { label: 'Alert',        color: 'var(--danger)',  bg: '#fdecea', icon: 'bi-x-circle-fill' },
  announcement: { label: 'Announcement', color: 'var(--accent)',  bg: '#fff4e0', icon: 'bi-megaphone-fill' },
};

const EMPTY = {
  title: '', message: '', type: 'info',
  targetRole: 'all', targetDepartment: '', targetSemester: '',
  pinned: false,
  expiresAt: '',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showModal, setShowModal]         = useState(false);
  const [form, setForm]                   = useState(EMPTY);
  const [editing, setEditing]             = useState(null);
  const [saving, setSaving]               = useState(false);
  const [msg, setMsg]                     = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications/all');
      setNotifications(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openCreate = () => { setForm(EMPTY); setEditing(null); setMsg(''); setShowModal(true); };
  const openEdit   = (n) => {
    setForm({
      title: n.title, message: n.message, type: n.type,
      targetRole: n.targetRole, targetDepartment: n.targetDepartment || '',
      targetSemester: n.targetSemester || '', pinned: n.pinned,
      expiresAt: n.expiresAt ? n.expiresAt.split('T')[0] : '',
    });
    setEditing(n);
    setMsg('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      const payload = {
        ...form,
        targetDepartment: form.targetDepartment || null,
        targetSemester: form.targetSemester ? Number(form.targetSemester) : null,
        expiresAt: form.expiresAt || null,
      };
      if (editing) {
        await api.put(`/notifications/${editing._id}`, payload);
      } else {
        await api.post('/notifications', payload);
      }
      setShowModal(false);
      fetchAll();
    } catch (err) { setMsg(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    await api.delete(`/notifications/${id}`);
    fetchAll();
  };

  const togglePin = async (n) => {
    await api.put(`/notifications/${n._id}`, { pinned: !n.pinned });
    fetchAll();
  };

  const toggleActive = async (n) => {
    await api.put(`/notifications/${n._id}`, { isActive: !n.isActive });
    fetchAll();
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date);
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 style={{ fontWeight: 700, color: 'var(--primary)', margin: 0 }}>Notifications & Announcements</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
            Broadcast messages to students and staff
          </p>
        </div>
        <button className="btn-primary-erp d-flex align-items-center gap-2" onClick={openCreate}>
          <i className="bi bi-megaphone"></i> New Announcement
        </button>
      </div>

      {/* Notification cards */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary-light)' }}></div></div>
      ) : notifications.length === 0 ? (
        <div className="erp-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <i className="bi bi-bell-slash" style={{ fontSize: '3rem', color: 'var(--border)' }}></i>
          <p style={{ color: 'var(--text-muted)', marginTop: 16 }}>No notifications yet. Create one to broadcast to students.</p>
        </div>
      ) : (
        <div className="row g-3">
          {notifications.map(n => {
            const meta = TYPE_META[n.type] || TYPE_META.info;
            return (
              <div key={n._id} className="col-12">
                <div className="erp-card" style={{ borderLeft: `4px solid ${meta.color}`, opacity: n.isActive ? 1 : 0.6 }}>
                  <div className="erp-card-body" style={{ padding: '16px 20px' }}>
                    <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
                      <div className="d-flex gap-3 align-items-start flex-1">
                        {/* Icon */}
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <i className={`bi ${meta.icon}`} style={{ color: meta.color, fontSize: '1.1rem' }}></i>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                            {n.pinned && <i className="bi bi-pin-angle-fill" style={{ color: 'var(--accent)', fontSize: '0.85rem' }}></i>}
                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>{n.title}</span>
                            <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, background: meta.bg, color: meta.color }}>
                              {meta.label}
                            </span>
                            {!n.isActive && <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, background: '#f0f4f8', color: 'var(--text-muted)' }}>Inactive</span>}
                          </div>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{n.message}</p>
                          <div className="d-flex gap-3 mt-2 flex-wrap" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <span><i className="bi bi-people me-1"></i>
                              {n.targetRole === 'all' ? 'Everyone' : n.targetRole === 'student' ? 'Students' : 'Teachers'}
                              {n.targetDepartment && ` • ${n.targetDepartment}`}
                              {n.targetSemester && ` • Sem ${n.targetSemester}`}
                            </span>
                            <span><i className="bi bi-clock me-1"></i>{timeAgo(n.createdAt)}</span>
                            <span><i className="bi bi-eye me-1"></i>{n.readBy?.length || 0} read</span>
                            {n.expiresAt && <span><i className="bi bi-calendar-x me-1"></i>Expires {new Date(n.expiresAt).toLocaleDateString('en-IN')}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="d-flex gap-2 align-items-center flex-shrink-0">
                        <button onClick={() => togglePin(n)} title={n.pinned ? 'Unpin' : 'Pin'} style={{
                          background: n.pinned ? '#fff4e0' : '#f0f4f8', border: 'none', borderRadius: 7,
                          padding: '6px 10px', cursor: 'pointer', color: n.pinned ? 'var(--accent)' : 'var(--text-muted)',
                        }}>
                          <i className="bi bi-pin-angle-fill"></i>
                        </button>
                        <button onClick={() => toggleActive(n)} title={n.isActive ? 'Deactivate' : 'Activate'} style={{
                          background: n.isActive ? '#fef3e2' : '#e6f7f0', border: 'none', borderRadius: 7,
                          padding: '6px 10px', cursor: 'pointer', color: n.isActive ? 'var(--warning)' : 'var(--success)',
                        }}>
                          <i className={`bi ${n.isActive ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
                        </button>
                        <button onClick={() => openEdit(n)} style={{
                          background: '#e8f0fe', border: 'none', borderRadius: 7,
                          padding: '6px 10px', cursor: 'pointer', color: 'var(--primary-light)',
                        }}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button onClick={() => handleDelete(n._id)} style={{
                          background: '#fdecea', border: 'none', borderRadius: 7,
                          padding: '6px 10px', cursor: 'pointer', color: 'var(--danger)',
                        }}>
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content" style={{ borderRadius: 16, border: 'none' }}>
              <div className="modal-header" style={{ background: 'var(--primary)', color: 'white', borderRadius: '16px 16px 0 0', border: 'none' }}>
                <h5 className="modal-title">
                  <i className="bi bi-megaphone me-2"></i>
                  {editing ? 'Edit Notification' : 'Create Notification'}
                </h5>
                <button className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  {msg && <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: '0.85rem' }}>{msg}</div>}
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Title *</label>
                      <input className="erp-input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Notification title" />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Message *</label>
                      <textarea className="erp-input" rows={4} required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Detailed message..." style={{ resize: 'vertical' }} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Type</label>
                      <select className="erp-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                        {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Target Audience</label>
                      <select className="erp-input" value={form.targetRole} onChange={e => setForm({ ...form, targetRole: e.target.value })}>
                        <option value="all">Everyone</option>
                        <option value="student">Students Only</option>
                        <option value="teacher">Teachers Only</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Department (optional)</label>
                      <select className="erp-input" value={form.targetDepartment} onChange={e => setForm({ ...form, targetDepartment: e.target.value })}>
                        <option value="">All Departments</option>
                        {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Semester (optional)</label>
                      <select className="erp-input" value={form.targetSemester} onChange={e => setForm({ ...form, targetSemester: e.target.value })}>
                        <option value="">All Semesters</option>
                        {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Expires On (optional)</label>
                      <input className="erp-input" type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} />
                    </div>
                    <div className="col-md-4 d-flex align-items-end">
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '10px 0' }}>
                        <input type="checkbox" checked={form.pinned} onChange={e => setForm({ ...form, pinned: e.target.checked })}
                          style={{ width: 18, height: 18, accentColor: 'var(--accent)', cursor: 'pointer' }} />
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>📌 Pin this notification</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="modal-footer" style={{ border: 'none' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary-erp" disabled={saving}>
                    {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-send me-2"></i>}
                    {editing ? 'Update' : 'Publish'}
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
