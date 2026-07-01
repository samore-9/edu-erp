// src/pages/teacher/TasksPage.js
import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';

const DEPARTMENTS = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'MBA', 'MCA'];
const TASK_TYPES = ['assignment', 'project', 'quiz', 'lab', 'presentation', 'other'];
const priorityColor = { high: '#fdecea', medium: '#fef3e2', low: '#e6f7f0' };
const priorityText = { high: 'var(--danger)', medium: 'var(--warning)', low: 'var(--success)' };

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [gradeForm, setGradeForm] = useState({ submissionId: '', score: '', letter: '', feedback: '' });

  const [form, setForm] = useState({
    title: '', description: '', type: 'assignment', subject: '',
    department: 'Computer Science', semester: 4,
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    maxScore: 100, priority: 'medium', status: 'published',
  });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = deptFilter ? `?department=${encodeURIComponent(deptFilter)}` : '';
      const { data } = await api.get(`/tasks${params}`);
      setTasks(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [deptFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      await api.post('/tasks', { ...form, semester: Number(form.semester), maxScore: Number(form.maxScore) });
      setShowModal(false);
      setMsg('✅ Task created successfully');
      fetchTasks();
    } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Failed')); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    await api.delete(`/tasks/${id}`);
    fetchTasks();
  };

  const openGradeModal = async (task) => {
    try {
      const { data } = await api.get(`/tasks/${task._id}`);
      setSelectedTask(data.data);
      setShowGradeModal(true);
    } catch (e) { console.error(e); }
  };

  const handleGrade = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/tasks/${selectedTask._id}/grade`, gradeForm);
      setShowGradeModal(false);
      setMsg('✅ Submission graded');
      fetchTasks();
    } catch (err) { alert(err.response?.data?.message || 'Grading failed'); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (task) => {
    const newStatus = task.status === 'published' ? 'closed' : 'published';
    try {
      await api.put(`/tasks/${task._id}`, { status: newStatus });
      fetchTasks();
    } catch (e) { console.error(e); }
  };

  const isOverdue = (dueDate) => new Date(dueDate) < new Date();

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 style={{ fontWeight: 700, color: 'var(--primary)', margin: 0 }}>Tasks & Assignments</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>Create and manage student tasks</p>
        </div>
        <button className="btn-primary-erp d-flex align-items-center gap-2" onClick={() => { setShowModal(true); setMsg(''); }}>
          <i className="bi bi-journal-plus"></i> New Task
        </button>
      </div>

      {msg && (
        <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-danger'} py-2 px-3 mb-3`} style={{ fontSize: '0.85rem', borderRadius: 8 }}>
          {msg}
        </div>
      )}

      {/* Filter */}
      <div className="erp-card mb-4">
        <div className="erp-card-body py-3">
          <div className="d-flex gap-3 align-items-center flex-wrap">
            <label className="fw-semibold" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Filter by Department:</label>
            <select className="erp-input" style={{ width: 'auto', minWidth: 200 }} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              <option value="">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
            {deptFilter && (
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setDeptFilter('')}>
                <i className="bi bi-x me-1"></i>Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Task Cards Grid */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary-light)' }}></div></div>
      ) : tasks.length === 0 ? (
        <div className="erp-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <i className="bi bi-journal-x" style={{ fontSize: '3rem', color: 'var(--border)' }}></i>
          <p style={{ color: 'var(--text-muted)', marginTop: 16 }}>No tasks yet. Create your first task!</p>
        </div>
      ) : (
        <div className="row g-3">
          {tasks.map(task => {
            const overdue = isOverdue(task.dueDate);
            const daysLeft = Math.ceil((new Date(task.dueDate) - new Date()) / 86400000);
            return (
              <div key={task._id} className="col-md-6 col-lg-4">
                <div className="erp-card h-100" style={{ position: 'relative', overflow: 'visible' }}>
                  {/* Priority ribbon */}
                  <div style={{
                    position: 'absolute', top: -1, right: 16,
                    background: priorityColor[task.priority], color: priorityText[task.priority],
                    padding: '3px 12px', borderRadius: '0 0 8px 8px',
                    fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px'
                  }}>
                    {task.priority} priority
                  </div>

                  <div className="erp-card-body" style={{ paddingTop: 24 }}>
                    <div className="d-flex align-items-start gap-2 mb-2">
                      <span style={{
                        background: '#f0ebff', color: '#7c3aed', borderRadius: 6,
                        padding: '3px 8px', fontSize: '0.72rem', fontWeight: 600, textTransform: 'capitalize', flexShrink: 0
                      }}>
                        {task.type}
                      </span>
                      <span style={{
                        background: task.status === 'published' ? '#e6f7f0' : '#f0f4f8',
                        color: task.status === 'published' ? 'var(--success)' : 'var(--text-muted)',
                        borderRadius: 6, padding: '3px 8px', fontSize: '0.72rem', fontWeight: 600
                      }}>
                        {task.status}
                      </span>
                    </div>

                    <h6 style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text)', lineHeight: 1.3 }}>{task.title}</h6>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {task.description || 'No description'}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                      {[
                        { icon: 'bi-book', text: task.subject },
                        { icon: 'bi-mortarboard', text: task.department },
                        { icon: 'bi-hash', text: `Sem ${task.semester}` },
                        { icon: 'bi-award', text: `${task.maxScore} marks` },
                      ].map(item => (
                        <span key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <i className={`bi ${item.icon}`}></i> {item.text}
                        </span>
                      ))}
                    </div>

                    <div style={{
                      background: overdue ? '#fdecea' : daysLeft <= 2 ? '#fef3e2' : '#f0f4f8',
                      borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: '0.8rem',
                      color: overdue ? 'var(--danger)' : daysLeft <= 2 ? 'var(--warning)' : 'var(--text-muted)',
                      fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6
                    }}>
                      <i className="bi bi-clock"></i>
                      Due: {new Date(task.dueDate).toLocaleDateString('en-IN')}
                      {overdue ? ' (OVERDUE)' : daysLeft === 0 ? ' (Today!)' : ` (${daysLeft}d left)`}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                      <span><i className="bi bi-person-check me-1"></i>{task.submissionCount || 0} submissions</span>
                      <span><i className="bi bi-person me-1"></i>{task.createdBy?.name}</span>
                    </div>

                    <div className="d-flex gap-2">
                      <button onClick={() => openGradeModal(task)} style={{
                        flex: 1, background: '#e8f0fe', color: 'var(--primary-light)', border: 'none',
                        borderRadius: 7, padding: '7px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer'
                      }}>
                        <i className="bi bi-star me-1"></i>Grade
                      </button>
                      <button onClick={() => toggleStatus(task)} style={{
                        flex: 1, background: task.status === 'published' ? '#f0f4f8' : '#e6f7f0',
                        color: task.status === 'published' ? 'var(--text-muted)' : 'var(--success)',
                        border: 'none', borderRadius: 7, padding: '7px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer'
                      }}>
                        <i className={`bi ${task.status === 'published' ? 'bi-lock' : 'bi-unlock'} me-1`}></i>
                        {task.status === 'published' ? 'Close' : 'Reopen'}
                      </button>
                      <button onClick={() => handleDelete(task._id)} style={{
                        background: '#fdecea', color: 'var(--danger)', border: 'none',
                        borderRadius: 7, padding: '7px 10px', fontSize: '0.78rem', cursor: 'pointer'
                      }}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content" style={{ borderRadius: 16, border: 'none' }}>
              <div className="modal-header" style={{ background: 'var(--primary)', color: 'white', borderRadius: '16px 16px 0 0', border: 'none' }}>
                <h5 className="modal-title"><i className="bi bi-journal-plus me-2"></i>Create New Task</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Title *</label>
                      <input className="erp-input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Task title" />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Description</label>
                      <textarea className="erp-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Task details and instructions..." style={{ resize: 'vertical' }} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Type</label>
                      <select className="erp-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                        {TASK_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Subject *</label>
                      <input className="erp-input" required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Data Structures" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Priority</label>
                      <select className="erp-input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                        {['low', 'medium', 'high'].map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="col-md-5">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Department *</label>
                      <select className="erp-input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                        {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="col-md-2">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Semester</label>
                      <select className="erp-input" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })}>
                        {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Max Score</label>
                      <input className="erp-input" type="number" value={form.maxScore} onChange={e => setForm({ ...form, maxScore: e.target.value })} min="1" />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Status</label>
                      <select className="erp-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                        {['published', 'draft'].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Due Date *</label>
                      <input className="erp-input" type="date" required value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer" style={{ border: 'none' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary-erp" disabled={saving}>
                    {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-plus-circle me-2"></i>}Create Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Grade Submissions Modal */}
      {showGradeModal && selectedTask && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content" style={{ borderRadius: 16, border: 'none' }}>
              <div className="modal-header" style={{ background: '#7c3aed', color: 'white', borderRadius: '16px 16px 0 0', border: 'none' }}>
                <h5 className="modal-title"><i className="bi bi-star me-2"></i>Grade Submissions — {selectedTask.title}</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowGradeModal(false)}></button>
              </div>
              <div className="modal-body">
                {!selectedTask.submissions?.length ? (
                  <div className="text-center py-4 text-muted">No submissions yet</div>
                ) : selectedTask.submissions.map(sub => (
                  <div key={sub._id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{sub.student?.user?.name || sub.student?.studentId || 'Student'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Submitted: {new Date(sub.submittedAt).toLocaleString('en-IN')}
                        </div>
                      </div>
                      <span className={`status-badge ${sub.status === 'graded' ? 'badge-paid' : sub.status === 'late' ? 'badge-overdue' : 'badge-pending'}`}>
                        {sub.status}
                      </span>
                    </div>

                    {sub.content && (
                      <div style={{ background: '#f0f4f8', borderRadius: 8, padding: '8px 12px', fontSize: '0.82rem', marginBottom: 10, color: 'var(--text)' }}>
                        {sub.content}
                      </div>
                    )}

                    {sub.status === 'graded' ? (
                      <div style={{ background: '#e6f7f0', borderRadius: 8, padding: '8px 12px', fontSize: '0.82rem' }}>
                        <strong>Grade: {sub.grade?.score}/{selectedTask.maxScore}</strong>
                        {sub.grade?.letter && ` (${sub.grade.letter})`}
                        {sub.grade?.feedback && <div style={{ marginTop: 4, color: 'var(--text-muted)' }}>{sub.grade.feedback}</div>}
                      </div>
                    ) : (
                      <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12 }}>
                        <div className="row g-2">
                          <div className="col-md-3">
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Score / {selectedTask.maxScore}</label>
                            <input className="erp-input" type="number" min="0" max={selectedTask.maxScore}
                              value={gradeForm.submissionId === sub._id ? gradeForm.score : ''}
                              onChange={e => setGradeForm({ submissionId: sub._id, ...gradeForm, score: e.target.value })}
                              onClick={() => setGradeForm({ ...gradeForm, submissionId: sub._id })}
                              placeholder="Score" style={{ padding: '7px 10px' }} />
                          </div>
                          <div className="col-md-2">
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Grade</label>
                            <select className="erp-input" style={{ padding: '7px 10px' }}
                              value={gradeForm.submissionId === sub._id ? gradeForm.letter : ''}
                              onChange={e => setGradeForm({ submissionId: sub._id, ...gradeForm, letter: e.target.value })}>
                              <option value="">—</option>
                              {['A+','A','B+','B','C+','C','D','F'].map(g => <option key={g}>{g}</option>)}
                            </select>
                          </div>
                          <div className="col-md-5">
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Feedback</label>
                            <input className="erp-input" style={{ padding: '7px 10px' }}
                              value={gradeForm.submissionId === sub._id ? gradeForm.feedback : ''}
                              onChange={e => setGradeForm({ submissionId: sub._id, ...gradeForm, feedback: e.target.value })}
                              placeholder="Optional feedback" />
                          </div>
                          <div className="col-md-2 d-flex align-items-end">
                            <button onClick={handleGrade} disabled={saving || gradeForm.submissionId !== sub._id || !gradeForm.score}
                              style={{
                                width: '100%', background: '#7c3aed', color: 'white', border: 'none',
                                borderRadius: 7, padding: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer'
                              }}>
                              {saving && gradeForm.submissionId === sub._id ? <span className="spinner-border spinner-border-sm"></span> : 'Save'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="modal-footer" style={{ border: 'none' }}>
                <button className="btn btn-secondary" onClick={() => setShowGradeModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
