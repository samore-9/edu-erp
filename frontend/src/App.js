// src/App.js — Root with routing
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentsPage from './pages/teacher/StudentsPage';
import AttendancePage from './pages/teacher/AttendancePage';
import FeesPage from './pages/teacher/FeesPage';
import TimetablePage from './pages/teacher/TimetablePage';
import LibraryPage from './pages/teacher/LibraryPage';
import TasksPage from './pages/teacher/TasksPage';
import ReportsPage from './pages/teacher/ReportsPage';
import NotificationsPage from './pages/teacher/NotificationsPage';
import StudentAttendancePage from './pages/student/StudentAttendancePage';
import StudentFeesPage from './pages/student/StudentFeesPage';
import StudentTimetablePage from './pages/student/StudentTimetablePage';
import StudentLibraryPage from './pages/student/StudentLibraryPage';
import StudentTasksPage from './pages/student/StudentTasksPage';
import StudentProfilePage from './pages/student/StudentProfilePage';
import SettingsPage from './pages/SettingsPage';
import Layout from './components/common/Layout';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

const PrivateRoute = ({ children, role }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} /> : <LoginPage />} />

      {/* Teacher Routes */}
      <Route path="/teacher" element={<PrivateRoute role="teacher"><Layout /></PrivateRoute>}>
        <Route index element={<TeacherDashboard />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="fees" element={<FeesPage />} />
        <Route path="timetable" element={<TimetablePage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Student Routes */}
      <Route path="/student" element={<PrivateRoute role="student"><Layout /></PrivateRoute>}>
        <Route index element={<StudentDashboard />} />
        <Route path="profile" element={<StudentProfilePage />} />
        <Route path="attendance" element={<StudentAttendancePage />} />
        <Route path="fees" element={<StudentFeesPage />} />
        <Route path="timetable" element={<StudentTimetablePage />} />
        <Route path="library" element={<StudentLibraryPage />} />
        <Route path="tasks" element={<StudentTasksPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="/" element={<Navigate to={user ? (user.role === 'teacher' ? '/teacher' : '/student') : '/login'} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
