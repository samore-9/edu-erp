// src/pages/LoginPage.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(email, password);
    if (result.success) {
      navigate(result.role === 'teacher' ? '/teacher' : '/student');
    } else {
      setError(result.message);
    }
  };

  const fillDemo = (role) => {
    if (role === 'teacher') { setEmail('teacher@college.edu'); setPassword('teacher123'); }
    else { setEmail('priya@student.edu'); setPassword('student123'); }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="text-center mb-4">
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🎓</div>
          <h2 style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.6rem', marginBottom: 4 }}>
            College ERP
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Integrated Campus Management System
          </p>
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: '0.85rem', borderRadius: 8 }}>
            <i className="bi bi-exclamation-circle me-2"></i>{error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>
              Email Address
            </label>
            <input
              type="email" className="erp-input" placeholder="you@college.edu"
              value={email} onChange={(e) => setEmail(e.target.value)} required
            />
          </div>
          <div className="mb-4">
            <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={show ? 'text' : 'password'} className="erp-input"
                placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)} required
                style={{ paddingRight: 40 }}
              />
              <button type="button" onClick={() => setShow(!show)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)'
              }}>
                <i className={`bi bi-eye${show ? '-slash' : ''}`}></i>
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary-erp w-100" disabled={loading}
            style={{ padding: '12px', fontSize: '0.95rem' }}>
            {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Signing in...</> : 'Sign In'}
          </button>
        </form>

        {/* Demo credentials */}
        <div style={{ marginTop: 24, padding: '16px', background: '#f0f4f8', borderRadius: 10 }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Quick Demo Access
          </p>
          <div className="d-flex gap-2">
            <button onClick={() => fillDemo('teacher')} style={{
              flex: 1, padding: '8px', background: 'var(--primary)', color: 'white',
              border: 'none', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
            }}>
              <i className="bi bi-person-workspace me-1"></i>Teacher
            </button>
            <button onClick={() => fillDemo('student')} style={{
              flex: 1, padding: '8px', background: 'var(--success)', color: 'white',
              border: 'none', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
            }}>
              <i className="bi bi-mortarboard me-1"></i>Student
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
