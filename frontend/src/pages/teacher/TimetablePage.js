// src/pages/teacher/TimetablePage.js
import { useState, useEffect } from 'react';
import api from '../../utils/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DEPARTMENTS = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'MBA', 'MCA'];
const PERIOD_COLORS = { lecture: '#e8f0fe', lab: '#e6f7f0', tutorial: '#fef3e2', break: '#f0f4f8' };
const PERIOD_TEXT = { lecture: 'var(--primary-light)', lab: 'var(--success)', tutorial: 'var(--warning)', break: 'var(--text-muted)' };

const emptyPeriod = () => ({ periodNumber: 1, subject: '', teacher: '', startTime: '09:00', endTime: '10:00', room: '', type: 'lecture' });

export default function TimetablePage() {
  const [timetables, setTimetables] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [createForm, setCreateForm] = useState({
    department: 'Computer Science', semester: 4, section: 'A', academicYear: '2024-2025',
    schedule: DAYS.map(day => ({ day, periods: [emptyPeriod()] })),
  });

  useEffect(() => {
    api.get('/timetable/all')
      .then(r => { setTimetables(r.data.data); if (r.data.data.length) setSelected(r.data.data[0]); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/timetable', createForm);
      setTimetables(prev => [...prev, data.data]);
      setSelected(data.data);
      setShowCreateModal(false);
    } catch (err) { alert(err.response?.data?.message || 'Failed to create timetable'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this timetable?')) return;
    await api.delete(`/timetable/${id}`);
    const updated = timetables.filter(t => t._id !== id);
    setTimetables(updated);
    setSelected(updated[0] || null);
  };

  const addPeriod = (dayIdx) => {
    const updated = [...createForm.schedule];
    updated[dayIdx].periods.push({ ...emptyPeriod(), periodNumber: updated[dayIdx].periods.length + 1 });
    setCreateForm({ ...createForm, schedule: updated });
  };

  const removePeriod = (dayIdx, pIdx) => {
    const updated = [...createForm.schedule];
    updated[dayIdx].periods.splice(pIdx, 1);
    setCreateForm({ ...createForm, schedule: updated });
  };

  const updatePeriod = (dayIdx, pIdx, field, val) => {
    const updated = JSON.parse(JSON.stringify(createForm.schedule));
    updated[dayIdx].periods[pIdx][field] = val;
    setCreateForm({ ...createForm, schedule: updated });
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary-light)' }}></div></div>;

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 style={{ fontWeight: 700, color: 'var(--primary)', margin: 0 }}>Timetable</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>Manage class schedules</p>
        </div>
        <button className="btn-primary-erp d-flex align-items-center gap-2" onClick={() => setShowCreateModal(true)}>
          <i className="bi bi-plus-circle"></i> Create Timetable
        </button>
      </div>

      <div className="row g-3">
        {/* Sidebar: timetable list */}
        <div className="col-lg-3">
          <div className="erp-card">
            <div className="erp-card-header"><h5>Timetables</h5></div>
            <div className="erp-card-body p-0">
              {timetables.length === 0 ? (
                <div className="text-center py-4 text-muted" style={{ fontSize: '0.85rem' }}>No timetables yet</div>
              ) : timetables.map(t => (
                <div key={t._id} onClick={() => setSelected(t)} style={{
                  padding: '14px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                  background: selected?._id === t._id ? '#e8f0fe' : 'white',
                  borderLeft: selected?._id === t._id ? '3px solid var(--primary-light)' : '3px solid transparent',
                }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: selected?._id === t._id ? 'var(--primary-light)' : 'var(--text)' }}>
                    {t.department}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Sem {t.semester} • Sec {t.section} • {t.academicYear}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(t._id); }}
                    style={{ marginTop: 6, background: '#fdecea', color: 'var(--danger)', border: 'none', borderRadius: 5, padding: '2px 8px', fontSize: '0.72rem', cursor: 'pointer' }}>
                    <i className="bi bi-trash"></i> Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main: timetable grid */}
        <div className="col-lg-9">
          {!selected ? (
            <div className="erp-card" style={{ padding: '60px', textAlign: 'center' }}>
              <i className="bi bi-calendar3" style={{ fontSize: '3rem', color: 'var(--border)' }}></i>
              <p style={{ color: 'var(--text-muted)', marginTop: 16 }}>Select or create a timetable to view it</p>
            </div>
          ) : (
            <div className="erp-card">
              <div className="erp-card-header">
                <h5>
                  <i className="bi bi-calendar3 me-2" style={{ color: 'var(--primary-light)' }}></i>
                  {selected.department} — Sem {selected.semester} | Section {selected.section} | {selected.academicYear}
                </h5>
              </div>
              <div className="erp-card-body" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '10px 14px', background: 'var(--surface2)', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', border: '1px solid var(--border)' }}>Day</th>
                      {Array.from({ length: Math.max(...selected.schedule.map(d => d.periods.length), 1) }, (_, i) => (
                        <th key={i} style={{ padding: '10px 14px', background: 'var(--surface2)', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', border: '1px solid var(--border)', textAlign: 'center' }}>
                          Period {i + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selected.schedule.map(daySchedule => (
                      <tr key={daySchedule.day}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, fontSize: '0.82rem', color: 'var(--primary)', border: '1px solid var(--border)', background: 'var(--surface2)', whiteSpace: 'nowrap' }}>
                          {daySchedule.day.slice(0, 3)}
                        </td>
                        {daySchedule.periods.map((p, i) => (
                          <td key={i} style={{ padding: '8px', border: '1px solid var(--border)', verticalAlign: 'top' }}>
                            <div style={{ background: PERIOD_COLORS[p.type] || '#f0f4f8', borderRadius: 8, padding: '8px 10px' }}>
                              {p.type === 'break' ? (
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, textAlign: 'center' }}>☕ Break</div>
                              ) : (
                                <>
                                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: PERIOD_TEXT[p.type] || 'var(--text)' }}>{p.subject}</div>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{p.teacher}</div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.startTime} – {p.endTime}</div>
                                  {p.room && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>🏫 {p.room}</div>}
                                  <span style={{ fontSize: '0.65rem', background: 'rgba(0,0,0,0.06)', borderRadius: 4, padding: '1px 5px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{p.type}</span>
                                </>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Timetable Modal */}
      {showCreateModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content" style={{ borderRadius: 16, border: 'none' }}>
              <div className="modal-header" style={{ background: 'var(--primary)', color: 'white', borderRadius: '16px 16px 0 0', border: 'none' }}>
                <h5 className="modal-title">Create New Timetable</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowCreateModal(false)}></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body">
                  {/* Meta */}
                  <div className="row g-3 mb-4">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Department *</label>
                      <select className="erp-input" value={createForm.department} onChange={e => setCreateForm({ ...createForm, department: e.target.value })}>
                        {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="col-md-2">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Semester</label>
                      <select className="erp-input" value={createForm.semester} onChange={e => setCreateForm({ ...createForm, semester: Number(e.target.value) })}>
                        {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="col-md-2">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Section</label>
                      <input className="erp-input" value={createForm.section} onChange={e => setCreateForm({ ...createForm, section: e.target.value })} placeholder="A" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Academic Year</label>
                      <input className="erp-input" value={createForm.academicYear} onChange={e => setCreateForm({ ...createForm, academicYear: e.target.value })} placeholder="2024-2025" />
                    </div>
                  </div>

                  {/* Per day schedule */}
                  {createForm.schedule.map((daySchedule, dayIdx) => (
                    <div key={daySchedule.day} style={{ marginBottom: 20, border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                      <div style={{ background: 'var(--primary)', color: 'white', padding: '10px 16px', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>{daySchedule.day}</span>
                        <button type="button" onClick={() => addPeriod(dayIdx)}
                          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: 6, padding: '3px 12px', fontSize: '0.78rem', cursor: 'pointer' }}>
                          + Add Period
                        </button>
                      </div>
                      <div style={{ padding: 12 }}>
                        {daySchedule.periods.map((p, pIdx) => (
                          <div key={pIdx} className="row g-2 align-items-end mb-2">
                            <div className="col-md-1">
                              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>No.</label>
                              <input className="erp-input" style={{ padding: '7px 10px' }} type="number" value={p.periodNumber}
                                onChange={e => updatePeriod(dayIdx, pIdx, 'periodNumber', Number(e.target.value))} />
                            </div>
                            <div className="col-md-2">
                              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Type</label>
                              <select className="erp-input" style={{ padding: '7px 10px' }} value={p.type}
                                onChange={e => updatePeriod(dayIdx, pIdx, 'type', e.target.value)}>
                                {['lecture', 'lab', 'tutorial', 'break'].map(t => <option key={t}>{t}</option>)}
                              </select>
                            </div>
                            <div className="col-md-2">
                              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Subject</label>
                              <input className="erp-input" style={{ padding: '7px 10px' }} value={p.subject}
                                onChange={e => updatePeriod(dayIdx, pIdx, 'subject', e.target.value)} placeholder="Subject" />
                            </div>
                            <div className="col-md-2">
                              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Teacher</label>
                              <input className="erp-input" style={{ padding: '7px 10px' }} value={p.teacher}
                                onChange={e => updatePeriod(dayIdx, pIdx, 'teacher', e.target.value)} placeholder="Prof. Name" />
                            </div>
                            <div className="col-md-1">
                              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Start</label>
                              <input className="erp-input" style={{ padding: '7px 8px' }} type="time" value={p.startTime}
                                onChange={e => updatePeriod(dayIdx, pIdx, 'startTime', e.target.value)} />
                            </div>
                            <div className="col-md-1">
                              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>End</label>
                              <input className="erp-input" style={{ padding: '7px 8px' }} type="time" value={p.endTime}
                                onChange={e => updatePeriod(dayIdx, pIdx, 'endTime', e.target.value)} />
                            </div>
                            <div className="col-md-2">
                              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Room</label>
                              <input className="erp-input" style={{ padding: '7px 10px' }} value={p.room}
                                onChange={e => updatePeriod(dayIdx, pIdx, 'room', e.target.value)} placeholder="Room no." />
                            </div>
                            <div className="col-md-1">
                              <button type="button" onClick={() => removePeriod(dayIdx, pIdx)}
                                style={{ width: '100%', background: '#fdecea', color: 'var(--danger)', border: 'none', borderRadius: 6, padding: '8px', cursor: 'pointer' }}>
                                <i className="bi bi-x"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                        {daySchedule.periods.length === 0 && (
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', padding: '8px 0' }}>No periods. Click "+ Add Period"</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="modal-footer" style={{ border: 'none' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary-erp" disabled={saving}>
                    {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-calendar-check me-2"></i>}Save Timetable
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
