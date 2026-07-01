// src/pages/student/StudentTasksPage.js
import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';

const priorityColor = { high: '#fdecea', medium: '#fef3e2', low: '#e6f7f0' };
const priorityText = { high: 'var(--danger)', medium: 'var(--warning)', low: 'var(--success)' };

export default function StudentTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [submitForm, setSubmitForm] = useState({ content: '', fileUrl: '' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [filter, setFilter] = useState('all'); // all | pending | submitted | graded

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/tasks/my');
      setTasks(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/tasks/${selectedTask._id}/submit`, submitForm);
      setShowSubmitModal(false);
      setMsg('✅ Task submitted successfully!');
      fetchTasks();
      setSubmitForm({ content: '', fileUrl: '' });
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || 'Submission failed'));
    } finally { setSubmitting(false); }
  };

  const openSubmit = (task) => {
    setSelectedTask(task);
    if (task.mySubmission) {
      setSubmitForm({ content: task.mySubmission.content || '', fileUrl: task.mySubmission.fileUrl || '' });
    } else {
      setSubmitForm({ content: '', fileUrl: '' });
    }
    setShowSubmitModal(true);
    setMsg('');
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'pending') return t.submissionStatus === 'not_submitted';
    if (filter === 'submitted') return ['submitted', 'late'].includes(t.submissionStatus);
    if (filter === 'graded') return t.submissionStatus === 'graded';
    return true;
  });

  const counts = {
    all: tasks.length,
    pending: tasks.filter(t => t.submissionStatus === 'not_submitted').length,
    submitted: tasks.filter(t => ['submitted', 'late'].includes(t.submissionStatus)).length,
    graded: tasks.filter(t => t.submissionStatus === 'graded').length,
  };

  return (
    <div>
      <h4 style={{ fontWeight: 700, color: 'var(--primary)', margin: '0 0 24px' }}>Tasks & Assignments</h4>

      {msg && (
        <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-danger'} py-2 px-3 mb-3`} style={{ fontSize: '0.85rem', borderRadius: 8 }}>
          {msg}
        </div>
      )}

      {/* Filter tabs */}
      <div className="d-flex gap-2 mb-4 flex-wrap">
        {Object.entries(counts).map(([key, count]) => (
          <button key={key} onClick={() => setFilter(key)} style={{
            padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '0.85rem',
            background: filter === key ? 'var(--primary-light)' : '#f0f4f8',
            color: filter === key ? 'white' : 'var(--text-muted)',
          }}>
            {key.charAt(0).toUpperCase() + key.slice(1)}
            <span style={{ marginLeft: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '1px 6px', fontSize: '0.75rem' }}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary-light)' }}></div></div>
      ) : filteredTasks.length === 0 ? (
        <div className="erp-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <i className="bi bi-journal-check" style={{ fontSize: '3rem', color: 'var(--border)' }}></i>
          <p style={{ color: 'var(--text-muted)', marginTop: 16 }}>
            {filter === 'pending' ? 'No pending tasks — you\'re all caught up! 🎉' : 'No tasks found'}
          </p>
        </div>
      ) : (
        <div className="row g-3">
          {filteredTasks.map(task => {
            const daysLeft = Math.ceil((new Date(task.dueDate) - new Date()) / 86400000);
            const isOverdue = daysLeft < 0;
            const submitted = task.submissionStatus !== 'not_submitted';
            const graded = task.submissionStatus === 'graded';
            const isLate = task.submissionStatus === 'late';

            return (
              <div key={task._id} className="col-md-6 col-lg-4">
                <div className="erp-card h-100" style={{ position: 'relative', overflow: 'visible' }}>
                  {/* Priority ribbon */}
                  <div style={{
                    position: 'absolute', top: -1, right: 16,
                    background: priorityColor[task.priority], color: priorityText[task.priority],
                    padding: '3px 12px', borderRadius: '0 0 8px 8px',
                    fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase'
                  }}>
                    {task.priority}
                  </div>

                  <div className="erp-card-body" style={{ paddingTop: 24 }}>
                    {/* Type badge + submission status */}
                    <div className="d-flex gap-2 mb-2 flex-wrap">
                      <span style={{ background: '#f0ebff', color: '#7c3aed', borderRadius: 6, padding: '3px 8px', fontSize: '0.72rem', fontWeight: 600, textTransform: 'capitalize' }}>
                        {task.type}
                      </span>
                      <span style={{
                        borderRadius: 6, padding: '3px 8px', fontSize: '0.72rem', fontWeight: 600,
                        background: graded ? '#e6f7f0' : submitted ? '#e8f0fe' : isOverdue ? '#fdecea' : '#fef3e2',
                        color: graded ? 'var(--success)' : submitted ? 'var(--primary-light)' : isOverdue ? 'var(--danger)' : 'var(--warning)',
                      }}>
                        {graded ? '✓ Graded' : submitted ? (isLate ? '⏰ Late Submitted' : '✓ Submitted') : isOverdue ? '⚠ Overdue' : '○ Pending'}
                      </span>
                    </div>

                    <h6 style={{ fontWeight: 700, marginBottom: 6, lineHeight: 1.3 }}>{task.title}</h6>
                    {task.description && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {task.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                      {[
                        { icon: 'bi-book', text: task.subject },
                        { icon: 'bi-award', text: `${task.maxScore} marks` },
                      ].map(item => (
                        <span key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <i className={`bi ${item.icon}`}></i> {item.text}
                        </span>
                      ))}
                    </div>

                    {/* Due date */}
                    <div style={{
                      background: isOverdue && !submitted ? '#fdecea' : daysLeft <= 2 && !submitted ? '#fef3e2' : '#f0f4f8',
                      borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: '0.8rem',
                      color: isOverdue && !submitted ? 'var(--danger)' : daysLeft <= 2 && !submitted ? 'var(--warning)' : 'var(--text-muted)',
                      fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6
                    }}>
                      <i className="bi bi-clock"></i>
                      Due: {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {!submitted && (isOverdue ? ' (OVERDUE)' : daysLeft === 0 ? ' (Today!)' : ` (${daysLeft}d left)`)}
                    </div>

                    {/* Grade result if graded */}
                    {graded && task.mySubmission?.grade && (
                      <div style={{ background: '#e6f7f0', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
                        <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: '0.9rem' }}>
                          Score: {task.mySubmission.grade.score}/{task.maxScore}
                          {task.mySubmission.grade.letter && ` (${task.mySubmission.grade.letter})`}
                        </div>
                        {task.mySubmission.grade.feedback && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            {task.mySubmission.grade.feedback}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action button */}
                    {task.status !== 'closed' && (
                      <button onClick={() => openSubmit(task)} style={{
                        width: '100%', padding: '9px', border: 'none', borderRadius: 8, cursor: 'pointer',
                        fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '0.85rem',
                        background: submitted ? '#e8f0fe' : 'var(--primary-light)',
                        color: submitted ? 'var(--primary-light)' : 'white',
                      }}>
                        <i className={`bi ${submitted ? 'bi-pencil' : 'bi-upload'} me-2`}></i>
                        {submitted ? 'Edit Submission' : 'Submit Task'}
                      </button>
                    )}
                    {task.status === 'closed' && !submitted && (
                      <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', padding: '8px', background: '#f0f4f8', borderRadius: 8 }}>
                        <i className="bi bi-lock me-1"></i>Task closed — submission window ended
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Modal */}
      {showSubmitModal && selectedTask && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content" style={{ borderRadius: 16, border: 'none' }}>
              <div className="modal-header" style={{ background: 'var(--primary-light)', color: 'white', borderRadius: '16px 16px 0 0', border: 'none' }}>
                <div>
                  <h5 className="modal-title mb-0">{selectedTask.mySubmission ? 'Edit Submission' : 'Submit Task'}</h5>
                  <div style={{ fontSize: '0.78rem', opacity: 0.8, marginTop: 2 }}>{selectedTask.title}</div>
                </div>
                <button className="btn-close btn-close-white" onClick={() => setShowSubmitModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-danger'} py-2 px-3 mb-3`} style={{ fontSize: '0.85rem' }}>{msg}</div>}

                  <div style={{ background: '#f0f4f8', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: '0.82rem' }}>
                    <div><strong>Subject:</strong> {selectedTask.subject}</div>
                    <div><strong>Due:</strong> {new Date(selectedTask.dueDate).toLocaleString('en-IN')}</div>
                    <div><strong>Max Score:</strong> {selectedTask.maxScore}</div>
                    {selectedTask.description && <div style={{ marginTop: 6, color: 'var(--text-muted)' }}>{selectedTask.description}</div>}
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Your Answer / Work Description *</label>
                    <textarea className="erp-input" rows={5} required
                      value={submitForm.content}
                      onChange={e => setSubmitForm({ ...submitForm, content: e.target.value })}
                      placeholder="Describe your work or paste your answer here..."
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>File / Link URL (optional)</label>
                    <input className="erp-input" type="url" value={submitForm.fileUrl}
                      onChange={e => setSubmitForm({ ...submitForm, fileUrl: e.target.value })}
                      placeholder="https://drive.google.com/... or GitHub link" />
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      Paste a Google Drive, GitHub, or any other link to your submission file.
                    </div>
                  </div>
                </div>
                <div className="modal-footer" style={{ border: 'none' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowSubmitModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary-erp" disabled={submitting}>
                    {submitting ? <><span className="spinner-border spinner-border-sm me-2"></span>Submitting...</> : <><i className="bi bi-upload me-2"></i>Submit</>}
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
