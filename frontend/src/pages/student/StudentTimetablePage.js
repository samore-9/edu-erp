// src/pages/student/StudentTimetablePage.js
import { useState, useEffect } from 'react';
import api from '../../utils/api';

const PERIOD_COLORS = { lecture: '#e8f0fe', lab: '#e6f7f0', tutorial: '#fef3e2', break: '#f0f4f8' };
const PERIOD_TEXT = { lecture: 'var(--primary-light)', lab: 'var(--success)', tutorial: 'var(--warning)', break: 'var(--text-muted)' };
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function StudentTimetablePage() {
  const [timetable, setTimetable] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(DAYS[new Date().getDay() - 1] || 'Monday');

  useEffect(() => {
    api.get('/students/me').then(async r => {
      const s = r.data.data;
      setProfile(s);
      try {
        const { data } = await api.get(`/timetable?department=${encodeURIComponent(s.department)}&semester=${s.semester}&section=${s.section}&academicYear=2024-2025`);
        setTimetable(data.data);
      } catch (e) {
        // Timetable may not exist yet
        setTimetable(null);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--primary-light)' }}></div></div>;

  const todaySchedule = timetable?.schedule?.find(d => d.day === activeDay);
  const currentHour = new Date().getHours();
  const currentMin = new Date().getMinutes();

  const isCurrentPeriod = (start, end) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const now = currentHour * 60 + currentMin;
    return now >= sh * 60 + sm && now <= eh * 60 + em;
  };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 style={{ fontWeight: 700, color: 'var(--primary)', margin: 0 }}>Timetable</h4>
          {profile && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
              {profile.department} • Sem {profile.semester} • Section {profile.section}
            </p>
          )}
        </div>
      </div>

      {!timetable ? (
        <div className="erp-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <i className="bi bi-calendar3" style={{ fontSize: '3rem', color: 'var(--border)' }}></i>
          <p style={{ color: 'var(--text-muted)', marginTop: 16 }}>No timetable available for your class yet. Check back later.</p>
        </div>
      ) : (
        <>
          {/* Day Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
            {DAYS.map(day => {
              const isToday = day === DAYS[new Date().getDay() - 1];
              const hasSchedule = timetable.schedule?.some(d => d.day === day && d.periods.length > 0);
              return (
                <button key={day} onClick={() => setActiveDay(day)} style={{
                  padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '0.85rem', flexShrink: 0,
                  background: activeDay === day ? 'var(--primary-light)' : isToday ? '#e8f4fe' : '#f0f4f8',
                  color: activeDay === day ? 'white' : isToday ? 'var(--primary-light)' : 'var(--text-muted)',
                  outline: isToday && activeDay !== day ? '2px solid var(--primary-light)' : 'none',
                  opacity: hasSchedule ? 1 : 0.5,
                }}>
                  {day.slice(0, 3)}
                  {isToday && <span style={{ marginLeft: 4, fontSize: '0.65rem', background: 'rgba(255,255,255,0.3)', borderRadius: 4, padding: '1px 4px' }}>TODAY</span>}
                </button>
              );
            })}
          </div>

          {/* Day Schedule */}
          {!todaySchedule?.periods?.length ? (
            <div className="erp-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <i className="bi bi-cup-hot" style={{ fontSize: '2rem', color: 'var(--border)' }}></i>
              <p style={{ color: 'var(--text-muted)', marginTop: 12 }}>No classes scheduled for {activeDay}</p>
            </div>
          ) : (
            <div className="erp-card">
              <div className="erp-card-header">
                <h5>{activeDay}'s Schedule</h5>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{todaySchedule.periods.length} periods</span>
              </div>
              <div className="erp-card-body p-0">
                {todaySchedule.periods.map((period, i) => {
                  const isCurrent = activeDay === DAYS[new Date().getDay() - 1] && period.type !== 'break' && isCurrentPeriod(period.startTime, period.endTime);
                  return (
                    <div key={i} style={{
                      display: 'flex', padding: '16px 20px', borderBottom: '1px solid var(--border)',
                      background: isCurrent ? '#f0f7ff' : 'white',
                      borderLeft: isCurrent ? '4px solid var(--primary-light)' : '4px solid transparent',
                    }}>
                      {/* Time column */}
                      <div style={{ width: 100, flexShrink: 0, paddingRight: 16 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', fontFamily: 'IBM Plex Mono, monospace' }}>
                          {period.startTime}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono, monospace' }}>
                          {period.endTime}
                        </div>
                        {isCurrent && (
                          <div style={{ marginTop: 4, fontSize: '0.65rem', background: 'var(--primary-light)', color: 'white', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>
                            NOW
                          </div>
                        )}
                      </div>

                      {/* Period info */}
                      <div style={{ flex: 1 }}>
                        {period.type === 'break' ? (
                          <div style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '1.2rem' }}>☕</span> Break
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                            <div style={{ background: PERIOD_COLORS[period.type], borderRadius: 8, padding: '10px 14px', flex: '1 1 200px' }}>
                              <div style={{ fontWeight: 700, color: PERIOD_TEXT[period.type], fontSize: '0.95rem' }}>{period.subject}</div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                <i className="bi bi-person me-1"></i>{period.teacher}
                                {period.room && <><span style={{ margin: '0 6px' }}>•</span><i className="bi bi-building me-1"></i>{period.room}</>}
                              </div>
                            </div>
                            <span style={{
                              fontSize: '0.72rem', background: '#f0f4f8', padding: '3px 8px',
                              borderRadius: 6, color: 'var(--text-muted)', textTransform: 'capitalize', fontWeight: 600
                            }}>
                              {period.type}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Full weekly overview */}
          <div className="erp-card mt-4">
            <div className="erp-card-header"><h5>Weekly Overview</h5></div>
            <div className="erp-card-body" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '10px 12px', background: 'var(--surface2)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', border: '1px solid var(--border)' }}>Day</th>
                    {timetable.schedule?.[0]?.periods?.map((_, i) => (
                      <th key={i} style={{ padding: '10px 12px', background: 'var(--surface2)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', border: '1px solid var(--border)', textAlign: 'center' }}>
                        Period {i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timetable.schedule?.map(daySchedule => (
                    <tr key={daySchedule.day}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, fontSize: '0.82rem', color: 'var(--primary)', background: 'var(--surface2)', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                        {daySchedule.day.slice(0, 3)}
                      </td>
                      {daySchedule.periods.map((p, i) => (
                        <td key={i} style={{ padding: '6px', border: '1px solid var(--border)', verticalAlign: 'top', minWidth: 100 }}>
                          <div style={{ background: PERIOD_COLORS[p.type], borderRadius: 6, padding: '6px 8px', fontSize: '0.78rem' }}>
                            {p.type === 'break' ? <span style={{ color: 'var(--text-muted)' }}>☕</span> : (
                              <>
                                <div style={{ fontWeight: 700, color: PERIOD_TEXT[p.type], lineHeight: 1.2 }}>{p.subject}</div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 1 }}>{p.startTime}–{p.endTime}</div>
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
        </>
      )}
    </div>
  );
}
