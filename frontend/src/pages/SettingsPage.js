// src/pages/SettingsPage.js — shared by teacher and student
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('security');

  // Password form
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwMsg, setPwMsg]   = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return setPwMsg({ type: 'error', text: 'New passwords do not match' });
    }
    if (pwForm.newPassword.length < 6) {
      return setPwMsg({ type: 'error', text: 'Password must be at least 6 characters' });
    }
    setPwSaving(true); setPwMsg('');
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwMsg({ type: 'success', text: 'Password changed successfully!' });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
    } finally { setPwSaving(false); }
  };

  const TABS = [
    { id: 'security', label: 'Security', icon: 'bi-shield-lock' },
    { id: 'account',  label: 'Account',  icon: 'bi-person-gear' },
  ];

  const PasswordInput = ({ label, field, value, onChange }) => (
    <div className="mb-3">
      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem', color: 'var(--text)' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          className="erp-input"
          type={showPw[field] ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required
          style={{ paddingRight: 44 }}
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={() => setShowPw(prev => ({ ...prev, [field]: !prev[field] }))}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
            padding: 0,
          }}
        >
          <i className={`bi bi-eye${showPw[field] ? '-slash' : ''}`}></i>
        </button>
      </div>
    </div>
  );

  // Password strength indicator
  const pwStrength = (pw) => {
    if (!pw) return null;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const labels = ['Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['var(--danger)', 'var(--warning)', 'var(--info)', 'var(--success)'];
    return { score, label: labels[Math.min(score - 1, 3)], color: colors[Math.min(score - 1, 3)] };
  };

  const strength = pwStrength(pwForm.newPassword);

  return (
    <div>
      <div className="mb-4">
        <h4 style={{ fontWeight: 700, color: 'var(--primary)', margin: 0 }}>Settings</h4>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>Manage your account preferences</p>
      </div>

      <div className="row g-4">
        {/* Left sidebar tabs */}
        <div className="col-lg-3">
          <div className="erp-card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Profile card */}
            <div style={{ padding: '24px 20px', textAlign: 'center', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, #0f2340, #1a3a5c)' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', margin: '0 auto 12px',
                background: 'var(--accent)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, color: 'white',
              }}>
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div style={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>{user?.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{user?.email}</div>
              <span style={{
                display: 'inline-block', marginTop: 8, padding: '3px 12px',
                borderRadius: 20, fontSize: '0.72rem', fontWeight: 600,
                background: user?.role === 'teacher' ? 'rgba(232,160,32,0.25)' : 'rgba(26,158,106,0.25)',
                color: user?.role === 'teacher' ? '#f5c842' : '#4ecf9f',
              }}>
                {user?.role === 'teacher' ? '👨‍🏫 Faculty' : '🎓 Student'}
              </span>
            </div>

            {/* Nav tabs */}
            <div style={{ padding: '8px 0' }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  width: '100%', padding: '11px 20px', border: 'none', background: 'none',
                  display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                  fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '0.85rem',
                  color: tab === t.id ? 'var(--primary-light)' : 'var(--text-muted)',
                  background: tab === t.id ? '#e8f0fe' : 'transparent',
                  borderLeft: tab === t.id ? '3px solid var(--primary-light)' : '3px solid transparent',
                  textAlign: 'left',
                }}>
                  <i className={`bi ${t.icon}`}></i> {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right content */}
        <div className="col-lg-9">

          {/* ─── Security Tab ─────────────────────────────────── */}
          {tab === 'security' && (
            <div className="erp-card">
              <div className="erp-card-header">
                <h5><i className="bi bi-shield-lock me-2" style={{ color: 'var(--primary-light)' }}></i>Change Password</h5>
              </div>
              <div className="erp-card-body" style={{ maxWidth: 480 }}>
                {pwMsg && (
                  <div className={`alert ${pwMsg.type === 'success' ? 'alert-success' : 'alert-danger'} py-2 px-3 mb-4`} style={{ fontSize: '0.85rem', borderRadius: 8 }}>
                    <i className={`bi ${pwMsg.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'} me-2`}></i>
                    {pwMsg.text}
                  </div>
                )}
                <form onSubmit={handlePasswordChange}>
                  <PasswordInput label="Current Password" field="current" value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
                  <PasswordInput label="New Password" field="new" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} />

                  {/* Strength meter */}
                  {strength && (
                    <div style={{ marginTop: -8, marginBottom: 16 }}>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                        {[0,1,2,3].map(i => (
                          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < strength.score ? strength.color : '#e2e8f0', transition: 'background 0.3s' }}></div>
                        ))}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: strength.color, fontWeight: 600 }}>
                        Password strength: {strength.label}
                      </div>
                    </div>
                  )}

                  <PasswordInput label="Confirm New Password" field="confirm" value={pwForm.confirmPassword} onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} />

                  {/* Requirements */}
                  <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: '0.78rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Password requirements:</div>
                    {[
                      { test: pwForm.newPassword.length >= 8, text: 'At least 8 characters' },
                      { test: /[A-Z]/.test(pwForm.newPassword), text: 'At least one uppercase letter' },
                      { test: /[0-9]/.test(pwForm.newPassword), text: 'At least one number' },
                      { test: /[^A-Za-z0-9]/.test(pwForm.newPassword), text: 'At least one special character' },
                    ].map(req => (
                      <div key={req.text} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, color: req.test ? 'var(--success)' : 'var(--text-muted)' }}>
                        <i className={`bi ${req.test ? 'bi-check-circle-fill' : 'bi-circle'}`} style={{ fontSize: '0.75rem' }}></i>
                        {req.text}
                      </div>
                    ))}
                  </div>

                  <button type="submit" className="btn-primary-erp w-100" disabled={pwSaving} style={{ padding: '12px' }}>
                    {pwSaving ? <><span className="spinner-border spinner-border-sm me-2"></span>Updating...</> : <><i className="bi bi-shield-check me-2"></i>Update Password</>}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ─── Account Tab ──────────────────────────────────── */}
          {tab === 'account' && (
            <div className="erp-card">
              <div className="erp-card-header">
                <h5><i className="bi bi-person-gear me-2" style={{ color: 'var(--primary-light)' }}></i>Account Information</h5>
              </div>
              <div className="erp-card-body">
                {[
                  { label: 'Full Name', value: user?.name },
                  { label: 'Email Address', value: user?.email },
                  { label: 'Role', value: user?.role === 'teacher' ? 'Faculty / Teacher' : 'Student' },
                  { label: 'Account Status', value: 'Active' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', padding: '14px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                    <span style={{ width: 180, flexShrink: 0, fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>{item.label}</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: item.label === 'Role' ? 700 : 500 }}>{item.value}</span>
                  </div>
                ))}

                {/* Danger Zone */}
                <div style={{ marginTop: 32, padding: 20, border: '1px solid #fca5a5', borderRadius: 12, background: '#fff5f5' }}>
                  <h6 style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: 8 }}>
                    <i className="bi bi-exclamation-octagon me-2"></i>Session Management
                  </h6>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                    Logging out will end your current session. You'll need to sign in again to access the system.
                  </p>
                  <button
                    onClick={logout}
                    style={{
                      background: 'var(--danger)', border: 'none', color: 'white',
                      padding: '9px 20px', borderRadius: 8, fontFamily: 'Sora, sans-serif',
                      fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                    }}
                  >
                    <i className="bi bi-box-arrow-right me-2"></i>Logout from All Sessions
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
