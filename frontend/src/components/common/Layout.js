// src/components/common/Layout.js
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';

const teacherNav = [
  { section: 'Main', items: [
    { to: '/teacher', label: 'Dashboard', icon: 'bi-speedometer2', end: true },
  ]},
  { section: 'Academic', items: [
    { to: '/teacher/students',     label: 'Students',       icon: 'bi-people' },
    { to: '/teacher/attendance',   label: 'Attendance',     icon: 'bi-calendar-check' },
    { to: '/teacher/timetable',    label: 'Timetable',      icon: 'bi-calendar3' },
    { to: '/teacher/tasks',        label: 'Tasks',          icon: 'bi-journal-text' },
  ]},
  { section: 'Finance & Resources', items: [
    { to: '/teacher/fees',         label: 'Fees',           icon: 'bi-cash-stack' },
    { to: '/teacher/library',      label: 'Library',        icon: 'bi-book' },
  ]},
  { section: 'Management', items: [
    { to: '/teacher/reports',      label: 'Reports',        icon: 'bi-graph-up' },
    { to: '/teacher/notifications',label: 'Notifications',  icon: 'bi-megaphone' },
    { to: '/teacher/settings',     label: 'Settings',       icon: 'bi-gear' },
  ]},
];

const studentNav = [
  { section: 'Main', items: [
    { to: '/student',          label: 'Dashboard',   icon: 'bi-speedometer2', end: true },
    { to: '/student/profile',  label: 'My Profile',  icon: 'bi-person-circle' },
  ]},
  { section: 'Academic', items: [
    { to: '/student/attendance', label: 'Attendance', icon: 'bi-calendar-check' },
    { to: '/student/timetable',  label: 'Timetable',  icon: 'bi-calendar3' },
    { to: '/student/tasks',      label: 'Tasks',      icon: 'bi-journal-text' },
  ]},
  { section: 'Finance & Resources', items: [
    { to: '/student/fees',     label: 'Fee Status',  icon: 'bi-cash-stack' },
    { to: '/student/library',  label: 'Library',     icon: 'bi-book' },
  ]},
  { section: 'Account', items: [
    { to: '/student/settings', label: 'Settings',    icon: 'bi-gear' },
  ]},
];

export default function Layout() {
  const { user, logout, isTeacher } = useAuth();
  const navigate = useNavigate();
  const navSections = isTeacher ? teacherNav : studentNav;

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="erp-layout">
      {/* Sidebar */}
      <aside className="erp-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">
            <span>🎓</span>
            <div>
              <div>EduERP</div>
              <div className="brand-sub">Campus Management</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navSections.map(section => (
            <div key={section.section}>
              <div className="sidebar-section-label">{section.section}</div>
              {section.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => isActive ? 'active' : ''}
                >
                  <i className={`bi ${item.icon}`}></i>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className={`role-badge ${isTeacher ? 'teacher' : 'student'}`}>
            {isTeacher ? '👨‍🏫 Faculty' : '🎓 Student'}
          </span>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name}
          </div>
          <button onClick={handleLogout} style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.6)', padding: '7px 14px', borderRadius: 8,
            fontSize: '0.8rem', cursor: 'pointer', width: '100%', fontFamily: 'Sora, sans-serif',
          }}>
            <i className="bi bi-box-arrow-left me-2"></i>Logout
          </button>
        </div>
      </aside>

      {/* Navbar */}
      <header className="erp-navbar">
        <span className="page-title">
          {isTeacher ? 'Faculty Portal' : 'Student Portal'}
        </span>
        <div className="user-info">
          <NotificationBell />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: '0.72rem', opacity: 0.6 }}>{user?.email}</div>
          </div>
          <div className="user-avatar">{initials}</div>
        </div>
      </header>

      {/* Main content */}
      <main className="erp-main">
        <Outlet />
      </main>
    </div>
  );
}
