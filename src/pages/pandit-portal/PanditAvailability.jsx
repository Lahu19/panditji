/**
 * PanditAvailability — weekly schedule + blocked dates calendar.
 */
import React, { useState, useEffect } from 'react';
import { panditPortalApi } from '../../api/panditPortal.js';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function CalendarMonth({ year, month, bookedSlots = [], blockedRanges = [] }) {
  const firstDay  = new Date(year, month, 1).getDay();
  const daysCount = new Date(year, month + 1, 0).getDate();
  const today     = new Date();

  const isBlocked = (day) => {
    const d = new Date(year, month, day);
    return blockedRanges.some(r => {
      const start = new Date(r.startDate);
      const end   = new Date(r.endDate);
      return d >= start && d <= end;
    });
  };

  const isBooked = (day) => {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return bookedSlots.some(s => s.date?.startsWith(dStr));
  };

  const isToday = (day) => {
    const d = new Date(year, month, day);
    return d.toDateString() === today.toDateString();
  };

  const isPast = (day) => new Date(year, month, day) < today;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysCount; d++) cells.push(d);

  return (
    <div className="pp-cal-grid">
      {DAYS_SHORT.map(d => (
        <div key={d} className="pp-cal-day pp-cal-day--header">{d}</div>
      ))}
      {cells.map((day, i) => {
        if (!day) return <div key={`e-${i}`} className="pp-cal-day pp-cal-day--empty" />;
        const cls = [
          'pp-cal-day',
          isBlocked(day) ? 'pp-cal-day--blocked' :
          isBooked(day)  ? 'pp-cal-day--booked'  : 'pp-cal-day--available',
          isToday(day)   ? 'pp-cal-day--today'   : '',
          isPast(day)    ? 'pp-cal-day--past'    : '',
        ].join(' ');
        return (
          <div key={day} className={cls} title={
            isBlocked(day) ? 'Blocked' : isBooked(day) ? 'Booked' : 'Available'
          }>
            {day}
          </div>
        );
      })}
    </div>
  );
}

export default function PanditAvailability() {
  const [avail,     setAvail]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [wh,        setWh]        = useState([]);
  const [showBlock, setShowBlock] = useState(false);
  const [blockForm, setBlockForm] = useState({ startDate: '', endDate: '', reason: '' });

  const now = new Date();
  const [calYear,  setCalYear]  = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  useEffect(() => {
    panditPortalApi.getAvailability()
      .then(d => {
        const a = d.availability || {};
        setAvail(a);
        setWh((a.workingHours || []).length > 0
          ? a.workingHours
          : DAYS.map((_, i) => ({ dayOfWeek: i, startTime: '08:00', endTime: '19:00', isActive: i > 0 }))
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const updateDay = (i, field, val) => {
    setWh(prev => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [field]: val };
      return copy;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await panditPortalApi.updateAvailability({
        workingHours:       wh,
        blockedRanges:      avail?.blockedRanges || [],
        maxDailyConcurrent: avail?.maxDailyConcurrent || 1,
        bookingWindowDays:  avail?.bookingWindowDays  || 60,
        minimumNoticeHours: avail?.minimumNoticeHours || 24,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const handleBlock = async () => {
    if (!blockForm.startDate || !blockForm.endDate) return;
    try {
      await panditPortalApi.blockDates(blockForm);
      setShowBlock(false);
      setBlockForm({ startDate: '', endDate: '', reason: '' });
      const fresh = await panditPortalApi.getAvailability();
      setAvail(fresh.availability);
    } catch (e) { alert(e.message); }
  };

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: '#aaa' }}>Loading availability…</div>;

  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  return (
    <div className="pp-content">
      <div className="pp-page-title">📅 Availability</div>
      <div className="pp-page-sub">Set when you're available for bookings</div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['#dcfce7','#16a34a','Available'],['#dbeafe','#2563eb','Booked'],['#fee2e2','#dc2626','Blocked']].map(([bg, color, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#555' }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: bg, border: `1px solid ${color}` }} />
            {label}
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="pp-card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <button className="pp-btn pp-btn--ghost pp-btn--sm" onClick={() => {
            if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1);
          }}>←</button>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            {MONTH_NAMES[calMonth]} {calYear}
          </div>
          <button className="pp-btn pp-btn--ghost pp-btn--sm" onClick={() => {
            if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1);
          }}>→</button>
        </div>
        <CalendarMonth
          year={calYear} month={calMonth}
          bookedSlots={avail?.bookedSlots || []}
          blockedRanges={avail?.blockedRanges || []}
        />
        <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
          <button className="pp-btn pp-btn--ghost pp-btn--sm" onClick={() => setShowBlock(true)}>
            🚫 Block Dates
          </button>
        </div>
      </div>

      {/* Block dates form */}
      {showBlock && (
        <div className="pp-card" style={{ marginBottom: 24, borderLeft: '4px solid #ef4444' }}>
          <div className="pp-card__title">Block Dates</div>
          <div className="pp-form-row">
            <div className="pp-form-group">
              <label className="pp-label">From</label>
              <input type="date" className="pp-input" value={blockForm.startDate} onChange={e => setBlockForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div className="pp-form-group">
              <label className="pp-label">To</label>
              <input type="date" className="pp-input" value={blockForm.endDate} onChange={e => setBlockForm(f => ({ ...f, endDate: e.target.value }))} />
            </div>
          </div>
          <div className="pp-form-group">
            <label className="pp-label">Reason (optional)</label>
            <input className="pp-input" value={blockForm.reason} onChange={e => setBlockForm(f => ({ ...f, reason: e.target.value }))} placeholder="Vacation, Personal…" />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="pp-btn pp-btn--ghost" onClick={() => setShowBlock(false)}>Cancel</button>
            <button className="pp-btn pp-btn--danger" onClick={handleBlock}>Block These Dates</button>
          </div>
        </div>
      )}

      {/* Weekly schedule */}
      <div className="pp-card">
        <div className="pp-card__title">Weekly Schedule</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {wh.map((day, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 10,
              background: day.isActive ? '#fffbee' : '#fafafa',
              border: `1.5px solid ${day.isActive ? '#f0e8c8' : '#eeeeee'}`,
            }}>
              <input
                type="checkbox" checked={day.isActive}
                onChange={e => updateDay(i, 'isActive', e.target.checked)}
                style={{ accentColor: 'var(--gold)', width: 16, height: 16, flexShrink: 0 }}
              />
              <span style={{ width: 90, fontWeight: day.isActive ? 600 : 400, fontSize: '0.86rem', color: day.isActive ? 'var(--text-dark)' : '#bbb' }}>
                {DAYS[i]}
              </span>
              {day.isActive ? (
                <>
                  <input type="time" value={day.startTime} onChange={e => updateDay(i, 'startTime', e.target.value)} className="pp-input" style={{ width: 130 }} />
                  <span style={{ color: '#aaa', fontSize: '0.82rem', flexShrink: 0 }}>to</span>
                  <input type="time" value={day.endTime} onChange={e => updateDay(i, 'endTime', e.target.value)} className="pp-input" style={{ width: 130 }} />
                </>
              ) : (
                <span style={{ fontSize: '0.8rem', color: '#bbb' }}>Not available</span>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {saved && <span style={{ fontSize: '0.82rem', color: '#22c55e' }}>✓ Saved successfully</span>}
          <div style={{ marginLeft: 'auto' }}>
            <button className="pp-btn pp-btn--primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : '💾 Save Schedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
