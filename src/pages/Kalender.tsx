import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { fetchAlleKlienten, createTermin, updateTermin, deleteTermin, fetchMeineTermine, sendTerminEmailSofort, sendTerminEmailArbeitszeit } from '../services/api';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

/* ---- Helpers ---- */
const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const WOCHENTAGE_LANG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const MONATE = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

const statusColors: Record<string, string> = {
  geplant: '#0d9488',
  abgeschlossen: '#059669',
  abgesagt: '#dc2626',
};
const statusLabels: Record<string, string> = {
  geplant: 'Geplant',
  abgeschlossen: 'Abgeschlossen',
  abgesagt: 'Abgesagt',
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isToday = (d: Date) => isSameDay(d, new Date());

const getMonday = (d: Date) => {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const formatTime = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

interface TerminEvent {
  id: string;
  title: string;
  klientName: string;
  klientId: string;
  start: Date;
  end: Date;
  dauer: number;
  status: string;
  beschreibung?: string;
  stundensatz?: number;
}

type ViewMode = 'month' | 'week' | 'day';

const Kalender = () => {
  const { isAdmin } = useAuth();
  const [events, setEvents] = useState<TerminEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Create modal
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [beschreibung, setBeschreibung] = useState('');
  const [dauerStunden, setDauerStunden] = useState(0);
  const [dauerMinuten, setDauerMinuten] = useState(30);
  const [klientId, setKlientId] = useState('');
  const [klienten, setKlienten] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [saving, setSaving] = useState(false);

  // E-Mail Modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTerminId, setEmailTerminId] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Detail popup
  const [selectedEvent, setSelectedEvent] = useState<TerminEvent | null>(null);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEvent, setEditEvent] = useState<TerminEvent | null>(null);
  const [editStartTime, setEditStartTime] = useState('09:00');
  const [editDauerStunden, setEditDauerStunden] = useState(0);
  const [editDauerMinuten, setEditDauerMinuten] = useState(30);
  const [editBeschreibung, setEditBeschreibung] = useState('');
  const [editKlientId, setEditKlientId] = useState('');
  const [editStatus, setEditStatus] = useState('geplant');
  const [editDate, setEditDate] = useState('');
  const [editStundensatz, setEditStundensatz] = useState<number | ''>('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteEvent, setDeleteEvent] = useState<TerminEvent | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchAlleKlienten().then(setKlienten).catch(console.error);
  }, []);

  const loadTermine = useCallback(async () => {
    try {
      const termine = await fetchMeineTermine();
      setEvents(
        termine.map((t: any) => ({
          id: t._id,
          title: t.klientName,
          klientName: t.klientName,
          klientId: t.klientId,
          start: new Date(t.datum),
          end: new Date(new Date(t.datum).getTime() + t.dauer * 60000),
          dauer: t.dauer,
          status: t.status,
          beschreibung: t.beschreibung,
          stundensatz: t.stundensatz,
        }))
      );
    } catch (err) {
      console.error('Fehler beim Laden der Termine:', err);
    }
  }, []);

  useEffect(() => { loadTermine(); }, [loadTermine]);

  /* ---- Calendar Grid Data ---- */
  const monthGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Start from Monday
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const days: Date[] = [];
    const startDate = new Date(year, month, 1 - startOffset);
    // 6 weeks max
    for (let i = 0; i < 42; i++) {
      days.push(new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i));
    }

    // Trim trailing week if all days are in next month
    const lastWeekStart = days.length - 7;
    if (days[lastWeekStart].getMonth() !== month) {
      days.splice(lastWeekStart, 7);
    }

    return { days, month, year, lastDay };
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const monday = getMonday(currentDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const getEventsForDay = useCallback(
    (day: Date) => events.filter((e) => isSameDay(e.start, day)).sort((a, b) => a.start.getTime() - b.start.getTime()),
    [events]
  );

  /* ---- Navigation ---- */
  const navigate = (dir: -1 | 1) => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + dir);
    else if (viewMode === 'week') d.setDate(d.getDate() + 7 * dir);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  };

  const goToday = () => setCurrentDate(new Date());

  const headerLabel = useMemo(() => {
    if (viewMode === 'month') return `${MONATE[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    if (viewMode === 'week') {
      const mon = getMonday(currentDate);
      const sun = new Date(mon);
      sun.setDate(sun.getDate() + 6);
      if (mon.getMonth() === sun.getMonth()) {
        return `${mon.getDate()}. – ${sun.getDate()}. ${MONATE[mon.getMonth()]} ${mon.getFullYear()}`;
      }
      return `${mon.getDate()}. ${MONATE[mon.getMonth()].slice(0, 3)} – ${sun.getDate()}. ${MONATE[sun.getMonth()].slice(0, 3)} ${sun.getFullYear()}`;
    }
    const dayIdx = currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1;
    return `${WOCHENTAGE_LANG[dayIdx]}, ${currentDate.getDate()}. ${MONATE[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }, [currentDate, viewMode]);

  /* ---- Day events (for day view or selected day in month) ---- */
  const dayEvents = useMemo(() => {
    const targetDay = viewMode === 'day' ? currentDate : selectedDay;
    if (!targetDay) return [];
    return getEventsForDay(targetDay);
  }, [viewMode, currentDate, selectedDay, getEventsForDay]);

  /* ---- Termin creation handler ---- */
  const openCreateModal = (date: Date) => {
    setSelectedSlot(date);
    setStartTime(formatTime(date));
    setShowModal(true);
    setErrorMessage('');
    setBeschreibung('');
    setDauerStunden(0);
    setDauerMinuten(30);
    setKlientId('');
  };

  const handleCreateTermin = async () => {
    if (saving) return;
    if (!selectedSlot || !klientId) {
      setErrorMessage('Bitte wählen Sie einen Klienten.');
      return;
    }
    setSaving(true);
    try {
      const [h, m] = startTime.split(':').map(Number);
      const datum = new Date(selectedSlot);
      datum.setHours(h, m, 0, 0);

      const neuerTermin = await createTermin({
        datum: datum.toISOString(),
        dauer: dauerStunden * 60 + dauerMinuten,
        beschreibung,
        klientId,
      });
      setShowModal(false);
      await loadTermine();
      // E-Mail-Modal anzeigen
      setEmailTerminId(neuerTermin._id);
      setShowEmailModal(true);
    } catch {
      setErrorMessage('Der Termin konnte nicht erstellt werden.');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailSofort = async () => {
    if (!emailTerminId || sendingEmail) return;
    setSendingEmail(true);
    try {
      await sendTerminEmailSofort(emailTerminId);
    } catch { /* ignore */ }
    setSendingEmail(false);
    setShowEmailModal(false);
    setEmailTerminId(null);
  };

  const handleEmailArbeitszeit = async () => {
    if (!emailTerminId || sendingEmail) return;
    setSendingEmail(true);
    try {
      await sendTerminEmailArbeitszeit(emailTerminId);
    } catch { /* ignore */ }
    setSendingEmail(false);
    setShowEmailModal(false);
    setEmailTerminId(null);
  };

  /* ---- Edit handler ---- */
  const openEditModal = (ev: TerminEvent) => {
    setEditEvent(ev);
    setEditStartTime(formatTime(ev.start));
    setEditDauerStunden(Math.floor(ev.dauer / 60));
    setEditDauerMinuten(ev.dauer % 60);
    setEditBeschreibung(ev.beschreibung || '');
    setEditKlientId(ev.klientId);
    setEditStatus(ev.status);
    setEditDate(ev.start.toISOString().slice(0, 10));
    setEditStundensatz(ev.stundensatz ?? '');
    setEditError('');
    setSelectedEvent(null);
    setShowEditModal(true);
  };

  const handleUpdateTermin = async () => {
    if (editSaving || !editEvent) return;
    if (!editKlientId) {
      setEditError('Bitte wählen Sie einen Klienten.');
      return;
    }
    setEditSaving(true);
    try {
      const [h, m] = editStartTime.split(':').map(Number);
      const datum = new Date(editDate);
      datum.setHours(h, m, 0, 0);

      const updateData: any = {
        datum: datum.toISOString(),
        dauer: editDauerStunden * 60 + editDauerMinuten,
        beschreibung: editBeschreibung,
        klientId: editKlientId,
        status: editStatus as 'geplant' | 'abgeschlossen' | 'abgesagt',
      };
      if (isAdmin && editStundensatz !== '') {
        updateData.stundensatz = Number(editStundensatz);
      }
      await updateTermin(editEvent.id, updateData);
      setShowEditModal(false);
      await loadTermine();
    } catch {
      setEditError('Der Termin konnte nicht aktualisiert werden.');
    } finally {
      setEditSaving(false);
    }
  };

  /* ---- Delete handler ---- */
  const openDeleteModal = (ev: TerminEvent) => {
    setDeleteEvent(ev);
    setSelectedEvent(null);
    setShowDeleteModal(true);
  };

  const handleDeleteTermin = async () => {
    if (deleting || !deleteEvent) return;
    setDeleting(true);
    try {
      await deleteTermin(deleteEvent.id);
      setShowDeleteModal(false);
      setDeleteEvent(null);
      await loadTermine();
    } catch {
      setEditError('Der Termin konnte nicht gelöscht werden.');
    } finally {
      setDeleting(false);
    }
  };

  /* ---- Hours for week/day view ---- */
  const hours = Array.from({ length: 24 }, (_, i) => i); // 0:00 - 23:00

  return (
    <div className="ikpd-page ikpd-kal">
      {/* Header */}
      <div className="ikpd-kal-header">
        <div className="ikpd-kal-header-left">
          <h2 className="ikpd-kal-title">{headerLabel}</h2>
          <div className="ikpd-kal-legend">
            {Object.entries(statusLabels).map(([key, label]) => (
              <span key={key} className="ikpd-kal-legend-item">
                <span className="ikpd-kal-legend-dot" style={{ background: statusColors[key] }} />
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="ikpd-kal-header-right">
          <div className="ikpd-kal-nav">
            <button className="ikpd-kal-nav-btn" onClick={() => navigate(-1)} title="Zurück">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button className="ikpd-kal-today-btn" onClick={goToday}>Heute</button>
            <button className="ikpd-kal-nav-btn" onClick={() => navigate(1)} title="Nächster">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
          <div className="ikpd-kal-views">
            {(['month', 'week', 'day'] as ViewMode[]).map((v) => (
              <button
                key={v}
                className={`ikpd-kal-view-btn${viewMode === v ? ' active' : ''}`}
                onClick={() => { setViewMode(v); setSelectedDay(null); }}
              >
                {v === 'month' ? 'Monat' : v === 'week' ? 'Woche' : 'Tag'}
              </button>
            ))}
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => openCreateModal(new Date())}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Neu
          </button>
        </div>
      </div>

      {/* ======== MONTH VIEW ======== */}
      {viewMode === 'month' && (
        <div className="ikpd-kal-month">
          <div className="ikpd-kal-month-head">
            {WOCHENTAGE.map((w) => (
              <div key={w} className="ikpd-kal-month-dow">{w}</div>
            ))}
          </div>
          <div className="ikpd-kal-month-grid">
            {monthGrid.days.map((day, i) => {
              const isCurrentMonth = day.getMonth() === monthGrid.month;
              const today = isToday(day);
              const dayEvs = getEventsForDay(day);
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              return (
                <div
                  key={i}
                  className={`ikpd-kal-month-cell${!isCurrentMonth ? ' off' : ''}${today ? ' today' : ''}${isSelected ? ' selected' : ''}`}
                  onClick={() => {
                    setSelectedDay(isSameDay(day, selectedDay || new Date(0)) ? null : day);
                  }}
                >
                  <span className={`ikpd-kal-month-day${today ? ' today' : ''}`}>
                    {day.getDate()}
                  </span>
                  <div className="ikpd-kal-month-events">
                    {dayEvs.slice(0, 3).map((ev, j) => (
                      <div
                        key={j}
                        className="ikpd-kal-month-event"
                        style={{ background: statusColors[ev.status] || '#64748b' }}
                        onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                      >
                        <span className="ikpd-kal-month-event-time">{formatTime(ev.start)}</span>
                        <span className="ikpd-kal-month-event-title">{ev.klientName}</span>
                      </div>
                    ))}
                    {dayEvs.length > 3 && (
                      <div className="ikpd-kal-month-more">+{dayEvs.length - 3} mehr</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected day detail panel */}
          {selectedDay && (
            <div className="ikpd-kal-day-detail">
              <div className="ikpd-kal-day-detail-header">
                <h4>
                  {WOCHENTAGE_LANG[selectedDay.getDay() === 0 ? 6 : selectedDay.getDay() - 1]}, {selectedDay.getDate()}. {MONATE[selectedDay.getMonth()]}
                </h4>
                <button className="ikpd-kal-day-detail-add" onClick={() => { const d = new Date(selectedDay); d.setHours(9, 0, 0, 0); openCreateModal(d); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  Termin
                </button>
              </div>
              {dayEvents.length === 0 ? (
                <div className="ikpd-kal-day-empty">Keine Termine an diesem Tag</div>
              ) : (
                <div className="ikpd-kal-day-events">
                  {dayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="ikpd-kal-day-event"
                      onClick={() => setSelectedEvent(ev)}
                    >
                      <div className="ikpd-kal-day-event-bar" style={{ background: statusColors[ev.status] }} />
                      <div className="ikpd-kal-day-event-time">{formatTime(ev.start)} – {formatTime(ev.end)}</div>
                      <div className="ikpd-kal-day-event-info">
                        <span className="ikpd-kal-day-event-name">{ev.klientName}</span>
                        <span className="ikpd-kal-day-event-meta">{ev.dauer} Min. · {statusLabels[ev.status] || ev.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======== WEEK VIEW ======== */}
      {viewMode === 'week' && (
        <div className="ikpd-kal-week">
          <div className="ikpd-kal-week-head">
            <div className="ikpd-kal-week-time-col" />
            {weekDays.map((day, i) => (
              <div
                key={i}
                className={`ikpd-kal-week-day-head${isToday(day) ? ' today' : ''}`}
                onClick={() => { setCurrentDate(day); setViewMode('day'); }}
              >
                <span className="ikpd-kal-week-dow">{WOCHENTAGE[i]}</span>
                <span className={`ikpd-kal-week-daynum${isToday(day) ? ' today' : ''}`}>{day.getDate()}</span>
              </div>
            ))}
          </div>
          <div className="ikpd-kal-week-body">
            {hours.map((h) => (
              <div key={h} className="ikpd-kal-week-row">
                <div className="ikpd-kal-week-time">{String(h).padStart(2, '0')}:00</div>
                {weekDays.map((day, di) => {
                  const cellEvents = getEventsForDay(day).filter((ev) => ev.start.getHours() === h);
                  return (
                    <div
                      key={di}
                      className={`ikpd-kal-week-cell${isToday(day) ? ' today' : ''}`}
                      onClick={() => { const d = new Date(day); d.setHours(h, 0, 0, 0); openCreateModal(d); }}
                    >
                      {cellEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className="ikpd-kal-week-event"
                          style={{ background: statusColors[ev.status], height: `${Math.max(ev.dauer / 60 * 100, 100)}%` }}
                          onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                        >
                          <span className="ikpd-kal-week-event-title">{ev.klientName}</span>
                          <span className="ikpd-kal-week-event-time">{formatTime(ev.start)}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======== DAY VIEW ======== */}
      {viewMode === 'day' && (
        <div className="ikpd-kal-dayview">
          <div className="ikpd-kal-dayview-body">
            {hours.map((h) => {
              const hourEvents = dayEvents.filter((ev) => ev.start.getHours() === h);
              return (
                <div key={h} className="ikpd-kal-dayview-row">
                  <div className="ikpd-kal-dayview-time">{String(h).padStart(2, '0')}:00</div>
                  <div
                    className="ikpd-kal-dayview-slot"
                    onClick={() => { const d = new Date(currentDate); d.setHours(h, 0, 0, 0); openCreateModal(d); }}
                  >
                    {hourEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="ikpd-kal-dayview-event"
                        style={{ borderLeftColor: statusColors[ev.status] }}
                        onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                      >
                        <div className="ikpd-kal-dayview-event-name">{ev.klientName}</div>
                        <div className="ikpd-kal-dayview-event-meta">
                          {formatTime(ev.start)} – {formatTime(ev.end)} · {ev.dauer} Min. · {statusLabels[ev.status]}
                        </div>
                        {ev.beschreibung && (
                          <div className="ikpd-kal-dayview-event-desc">{ev.beschreibung}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======== EVENT DETAIL MODAL ======== */}
      <Modal show={!!selectedEvent} onHide={() => setSelectedEvent(null)} centered size="sm">
        {selectedEvent && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>
                <span className="ikpd-modal-icon ikpd-modal-icon--info">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </span>
                <span className="ikpd-modal-header-text">
                  Termindetails
                  <span className="ikpd-modal-subtitle">{selectedEvent.klientName}</span>
                </span>
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="ikpd-kal-detail">
                <div className="ikpd-kal-detail-row">
                  <span className="ikpd-kal-detail-label">Klient</span>
                  <span className="ikpd-kal-detail-value">{selectedEvent.klientName}</span>
                </div>
                <div className="ikpd-kal-detail-row">
                  <span className="ikpd-kal-detail-label">Datum</span>
                  <span className="ikpd-kal-detail-value">
                    {selectedEvent.start.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div className="ikpd-kal-detail-row">
                  <span className="ikpd-kal-detail-label">Uhrzeit</span>
                  <span className="ikpd-kal-detail-value">{formatTime(selectedEvent.start)} – {formatTime(selectedEvent.end)}</span>
                </div>
                <div className="ikpd-kal-detail-row">
                  <span className="ikpd-kal-detail-label">Dauer</span>
                  <span className="ikpd-kal-detail-value">{selectedEvent.dauer} Min.</span>
                </div>
                <div className="ikpd-kal-detail-row">
                  <span className="ikpd-kal-detail-label">Status</span>
                  <span className="ikpd-kal-detail-value">
                    <span className="ikpd-kal-status-badge" style={{ background: statusColors[selectedEvent.status] }}>
                      {statusLabels[selectedEvent.status] || selectedEvent.status}
                    </span>
                  </span>
                </div>
                {selectedEvent.beschreibung && (
                  <div className="ikpd-kal-detail-row">
                    <span className="ikpd-kal-detail-label">Notiz</span>
                    <span className="ikpd-kal-detail-value">{selectedEvent.beschreibung}</span>
                  </div>
                )}
              </div>
            </Modal.Body>
            <Modal.Footer>
              <div className="ikpd-modal-footer-full">
                <Button variant="outline-danger" onClick={() => openDeleteModal(selectedEvent)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  {' '}Löschen
                </Button>
                <Button variant="primary" onClick={() => openEditModal(selectedEvent)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                  {' '}Bearbeiten
                </Button>
              </div>
            </Modal.Footer>
          </>
        )}
      </Modal>

      {/* ======== EDIT MODAL ======== */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            <span className="ikpd-modal-icon ikpd-modal-icon--primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
            </span>
            <span className="ikpd-modal-header-text">
              Termin bearbeiten
              <span className="ikpd-modal-subtitle">Daten des Termins ändern</span>
            </span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Datum</Form.Label>
              <Form.Control
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Startzeit</Form.Label>
              <Form.Control
                type="time"
                value={editStartTime}
                onChange={(e) => setEditStartTime(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Klient</Form.Label>
              <Form.Select value={editKlientId} onChange={(e: any) => setEditKlientId(e.target.value)}>
                <option value="">Klient auswählen</option>
                {klienten.map((k) => (
                  <option key={k._id} value={k._id}>{k.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Dauer</Form.Label>
              <div className="d-flex gap-2 align-items-center">
                <Form.Control
                  type="number"
                  value={editDauerStunden}
                  onChange={(e: any) => setEditDauerStunden(Math.max(0, Number(e.target.value)))}
                  min={0}
                  style={{ width: '80px' }}
                />
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>Std.</span>
                <Form.Select
                  value={editDauerMinuten}
                  onChange={(e: any) => setEditDauerMinuten(Number(e.target.value))}
                  style={{ width: '80px' }}
                >
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </Form.Select>
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>Min.</span>
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select value={editStatus} onChange={(e: any) => setEditStatus(e.target.value)}>
                <option value="geplant">Geplant</option>
                <option value="abgeschlossen">Abgeschlossen</option>
                <option value="abgesagt">Abgesagt</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Stundensatz (€/Std.)</Form.Label>
              {isAdmin ? (
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  value={editStundensatz}
                  onChange={(e: any) => setEditStundensatz(e.target.value === '' ? '' : Number(e.target.value))}
                />
              ) : (
                <Form.Control
                  type="text"
                  value={editStundensatz !== '' ? `${editStundensatz} €` : '–'}
                  readOnly
                  plaintext
                />
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Beschreibung</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={editBeschreibung}
                onChange={(e: any) => setEditBeschreibung(e.target.value)}
              />
            </Form.Group>
          </Form>
          {editError && (
            <div className="alert alert-danger py-2" role="alert">{editError}</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className="ikpd-modal-footer-full">
            <Button variant="light" onClick={() => setShowEditModal(false)}>Abbrechen</Button>
            <Button variant="primary" onClick={handleUpdateTermin} disabled={editSaving}>
              {editSaving ? <Spinner animation="border" size="sm" /> : 'Speichern'}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* ======== DELETE CONFIRMATION MODAL ======== */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered size="sm">
        <Modal.Body>
          <div className="ikpd-modal-delete-body">
            <div className="ikpd-modal-delete-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </div>
            <div className="ikpd-modal-delete-title">Termin löschen?</div>
            <p className="ikpd-modal-delete-text">
              Termin mit <strong>{deleteEvent?.klientName}</strong> am{' '}
              {deleteEvent?.start.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}{' '}
              wird unwiderruflich gelöscht.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className="ikpd-modal-footer-full">
            <Button variant="light" onClick={() => setShowDeleteModal(false)}>Abbrechen</Button>
            <Button variant="danger" onClick={handleDeleteTermin} disabled={deleting}>
              {deleting ? <Spinner animation="border" size="sm" /> : 'Löschen'}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* ======== CREATE MODAL ======== */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            <span className="ikpd-modal-icon ikpd-modal-icon--success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><path d="m9 16 2 2 4-4"/></svg>
            </span>
            <span className="ikpd-modal-header-text">
              Neuen Termin erstellen
              <span className="ikpd-modal-subtitle">Klient, Zeit und Dauer angeben</span>
            </span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSlot && (
            <div className="ikpd-termin-slot-info mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {selectedSlot.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          )}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Startzeit</Form.Label>
              <Form.Control
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Klient</Form.Label>
              <Form.Select value={klientId} onChange={(e: any) => setKlientId(e.target.value)}>
                <option value="">Klient auswählen</option>
                {klienten.map((k) => (
                  <option key={k._id} value={k._id}>{k.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Dauer</Form.Label>
              <div className="d-flex gap-2 align-items-center">
                <Form.Control
                  type="number"
                  value={dauerStunden}
                  onChange={(e: any) => setDauerStunden(Math.max(0, Number(e.target.value)))}
                  min={0}
                  style={{ width: '80px' }}
                />
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>Std.</span>
                <Form.Select
                  value={dauerMinuten}
                  onChange={(e: any) => setDauerMinuten(Number(e.target.value))}
                  style={{ width: '80px' }}
                >
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </Form.Select>
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>Min.</span>
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Beschreibung</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={beschreibung}
                onChange={(e: any) => setBeschreibung(e.target.value)}
              />
            </Form.Group>
          </Form>
          {errorMessage && (
            <div className="alert alert-danger py-2" role="alert">{errorMessage}</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className="ikpd-modal-footer-full">
            <Button variant="light" onClick={() => setShowModal(false)}>Abbrechen</Button>
            <Button variant="primary" onClick={handleCreateTermin} disabled={saving}>{saving ? 'Erstelle...' : 'Termin erstellen'}</Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* E-Mail Bestätigung Modal */}
      <Modal show={showEmailModal} onHide={() => { setShowEmailModal(false); setEmailTerminId(null); }} centered size="sm">
        <Modal.Body>
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            </div>
            <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Terminbestätigung senden?</div>
            <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>Wann soll die E-Mail an den Klienten gesendet werden?</p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
            <Button variant="primary" onClick={handleEmailSofort} disabled={sendingEmail}>
              {sendingEmail ? <Spinner animation="border" size="sm" /> : 'Jetzt senden'}
            </Button>
            <Button variant="outline-primary" onClick={handleEmailArbeitszeit} disabled={sendingEmail}>
              Während Arbeitszeit senden (Mo–Fr, 08–17 Uhr)
            </Button>
            <Button variant="light" onClick={() => { setShowEmailModal(false); setEmailTerminId(null); }}>
              Nicht senden
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Kalender;
