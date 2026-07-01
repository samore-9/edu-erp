// src/pages/student/StudentProfilePage.js
import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function StudentProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/students/me')
      .then(r => setProfile(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary-light)' }}></div></div>;
  if (!profile) return <div className="text-center py-5 text-muted">Profile not found</div>;

  const InfoRow = ({ label, value, mono }) => (
    <div style={{ display: 'flex', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ width: 180, flexShrink: 0, fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: '0.88rem', fontFamily: mono ? 'IBM Plex Mono, monospace' : 'inherit', color: 'var(--text)' }}>{value || '—'}</span>
    </div>
  );

  return (
    <div>
      <h4 style={{ fontWeight: 700, color: 'var(--primary)', margin: '0 0 24px' }}>My Profile</h4>
      <div className="row g-3">
        {/* Left: Avatar + quick info */}
        <div className="col-lg-4">
          <div className="erp-card text-center" style={{ padding: 32 }}>
            <div style={{
              width: 96, height: 96, borderRadius: '50%', margin: '0 auto 16px',
              background: 'linear-gradient(135deg, var(--primary-light), var(--primary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '2rem', fontWeight: 800
            }}>
              {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <h5 style={{ fontWeight: 700, marginBottom: 4 }}>{user?.name}</h5>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 8 }}>{user?.email}</div>
            <span style={{ background: '#e8f0fe', color: 'var(--primary-light)', borderRadius: 20, padding: '4px 14px', fontSize: '0.78rem', fontWeight: 600 }}>
              Student
            </span>

            <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Student ID', value: profile.studentId },
                { label: 'Roll No.', value: profile.rollNumber },
                { label: 'Semester', value: `Sem ${profile.semester}` },
                { label: 'CGPA', value: profile.cgpa?.toFixed(1) || '—' },
              ].map(item => (
                <div key={item.label} style={{ background: '#f0f4f8', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: 2 }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16 }}>
              <span className={`status-badge badge-${profile.status === 'active' ? 'paid' : 'absent'}`} style={{ fontSize: '0.82rem', padding: '5px 14px' }}>
                {profile.status}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Details */}
        <div className="col-lg-8">
          <div className="erp-card mb-3">
            <div className="erp-card-header"><h5><i className="bi bi-mortarboard me-2" style={{ color: 'var(--primary-light)' }}></i>Academic Information</h5></div>
            <div className="erp-card-body">
              <InfoRow label="Department" value={profile.department} />
              <InfoRow label="Semester" value={`Semester ${profile.semester}`} />
              <InfoRow label="Year" value={`Year ${profile.year}`} />
              <InfoRow label="Batch" value={profile.batch} />
              <InfoRow label="Section" value={profile.section} />
              <InfoRow label="CGPA" value={profile.cgpa?.toFixed(2)} />
              <InfoRow label="Admission Date" value={new Date(profile.admissionDate).toLocaleDateString('en-IN')} />
            </div>
          </div>

          <div className="erp-card mb-3">
            <div className="erp-card-header"><h5><i className="bi bi-person me-2" style={{ color: 'var(--success)' }}></i>Personal Information</h5></div>
            <div className="erp-card-body">
              <InfoRow label="Date of Birth" value={profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-IN') : null} />
              <InfoRow label="Gender" value={profile.gender} />
              <InfoRow label="Phone" value={profile.phone} />
              <InfoRow label="Address" value={profile.address ? `${profile.address.street || ''}, ${profile.address.city || ''}, ${profile.address.state || ''} - ${profile.address.pincode || ''}` : null} />
            </div>
          </div>

          {profile.guardian?.name && (
            <div className="erp-card">
              <div className="erp-card-header"><h5><i className="bi bi-people me-2" style={{ color: 'var(--accent)' }}></i>Guardian Information</h5></div>
              <div className="erp-card-body">
                <InfoRow label="Guardian Name" value={profile.guardian.name} />
                <InfoRow label="Relation" value={profile.guardian.relation} />
                <InfoRow label="Phone" value={profile.guardian.phone} />
                <InfoRow label="Email" value={profile.guardian.email} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
