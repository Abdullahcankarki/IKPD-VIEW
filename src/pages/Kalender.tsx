import { Modal, Button, Form, Badge } from 'react-bootstrap';
import { fetchAlleKlienten, createTermin } from '../services/api';
import { Calendar, Views, dateFnsLocalizer, Event, View } from 'react-big-calendar';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfWeek as originalStartOfWeek } from 'date-fns/startOfWeek';
import { getDay } from 'date-fns/getDay';
import { de } from 'date-fns/locale/de';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useEffect, useState } from 'react';
import { fetchMeineTermine } from '../services/api';
import moment from 'moment-timezone';

moment.tz.setDefault('Europe/Berlin');

const locales = { de };
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: (date: any) => originalStartOfWeek(date, { locale: de }),
    getDay,
    locales,
});

const statusColors: Record<string, string> = {
    geplant: 'var(--ikpd-primary)',
    abgeschlossen: '#059669',
    abgesagt: '#dc2626',
};

const statusLabels: Record<string, string> = {
    geplant: 'Geplant',
    abgeschlossen: 'Abgeschlossen',
    abgesagt: 'Abgesagt',
};

const Kalender = () => {
    const [events, setEvents] = useState<Event[]>([]);

    const [showModal, setShowModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
    const [beschreibung, setBeschreibung] = useState('');
    const [dauer, setDauer] = useState(30);
    const [klientId, setKlientId] = useState('');
    const [klienten, setKlienten] = useState<any[]>([]);

    const [currentView, setCurrentView] = useState<View>(Views.MONTH);
    const [currentDate, setCurrentDate] = useState(new Date());

    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const loadKlienten = async () => {
            try {
                const result = await fetchAlleKlienten();
                setKlienten(result);
            } catch (err) {
                console.error('Fehler beim Laden der Klienten:', err);
            }
        };
        loadKlienten();
    }, []);

    useEffect(() => {
        const load = async () => {
            try {
                const termine = await fetchMeineTermine();
                const mapped = termine.map((t: any) => ({
                    title: t.klientName + ' (' + t.status + ')',
                    start: new Date(t.datum),
                    end: new Date(new Date(t.datum).getTime() + t.dauer * 60000),
                    status: t.status,
                }));
                setEvents(mapped);
            } catch (err) {
                console.error('Fehler beim Laden der Termine:', err);
            }
        };
        load();
    }, []);

    return (
        <div className="ikpd-page ikpd-kalender-page">
            <div className="ikpd-page-header">
                <h2>Meine Termine</h2>
                <div className="ikpd-page-actions">
                    <div className="ikpd-kalender-legend">
                        {Object.entries(statusLabels).map(([key, label]) => (
                            <Badge
                                key={key}
                                style={{ backgroundColor: statusColors[key] }}
                                className="me-1"
                            >
                                {label}
                            </Badge>
                        ))}
                    </div>
                </div>
            </div>
            <div className="ikpd-kalender-wrapper">
                <Calendar
                    localizer={localizer}
                    culture="de"
                    messages={{
                        next: "Nächster",
                        previous: "Zurück",
                        today: "Heute",
                        month: "Monat",
                        week: "Woche",
                        day: "Tag",
                        agenda: "Agenda",
                        date: "Datum",
                        time: "Uhrzeit",
                        event: "Termin",
                        noEventsInRange: "Keine Termine im ausgewählten Zeitraum.",
                        showMore: (total) => `+${total} mehr`,
                    }}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%', minHeight: 500 }}
                    eventPropGetter={(event: any) => {
                        const color = statusColors[event.status] || '#64748b';
                        return {
                            style: {
                                backgroundColor: color,
                                color: 'white',
                                borderRadius: '6px',
                                border: 'none',
                                padding: '2px 6px',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                            },
                        };
                    }}
                    views={[Views.MONTH, Views.WEEK, Views.DAY]}
                    selectable
                    onSelectSlot={(slotInfo) => {
                        setSelectedSlot({ start: slotInfo.start, end: slotInfo.end });
                        setShowModal(true);
                        setErrorMessage('');
                    }}
                    view={currentView}
                    onView={(view) => setCurrentView(view)}
                    date={currentDate}
                    onNavigate={(date) => setCurrentDate(date)}
                />
                <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
                    <Modal.Header closeButton>
                        <Modal.Title>Neuen Termin erstellen</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {selectedSlot && (
                            <div className="ikpd-termin-slot-info mb-3">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2">
                                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                                {moment(selectedSlot.start).tz('Europe/Berlin').locale('de').format('dddd, DD. MMMM YYYY, HH:mm')}
                            </div>
                        )}
                        <Form>
                            {selectedSlot && (
                                <Form.Group className="mb-3">
                                    <Form.Label>Startzeit bearbeiten</Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        value={selectedSlot ? moment(selectedSlot.start).format('YYYY-MM-DDTHH:mm') : ''}
                                        onChange={(e) => {
                                            if (selectedSlot) {
                                                const updated = new Date(e.target.value);
                                                setSelectedSlot({ ...selectedSlot, start: updated });
                                            }
                                        }}
                                    />
                                </Form.Group>
                            )}
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
                                <Form.Label>Dauer (Minuten)</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={dauer}
                                    onChange={(e: any) => setDauer(Number(e.target.value))}
                                    min={1}
                                />
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
                            <div className="alert alert-danger py-2" role="alert">
                                {errorMessage}
                            </div>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)} title="Abbrechen">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </Button>
                        <Button
                            variant="primary"
                            title="Termin speichern"
                            onClick={async () => {
                                if (!selectedSlot || !klientId) {
                                    setErrorMessage('Bitte wählen Sie einen Klienten.');
                                    return;
                                }
                                try {
                                    await createTermin({
                                        datum: moment(selectedSlot.start).toISOString(),
                                        dauer,
                                        beschreibung,
                                        klientId,
                                    });
                                    setShowModal(false);
                                    setBeschreibung('');
                                    setDauer(30);
                                    setKlientId('');
                                    const termine = await fetchMeineTermine();
                                    const mapped = termine.map((t: any) => ({
                                        title: t.klientName + ' (' + t.status + ')',
                                        start: new Date(t.datum),
                                        end: new Date(new Date(t.datum).getTime() + t.dauer * 60000),
                                        status: t.status,
                                    }));
                                    setEvents(mapped);
                                } catch (err) {
                                    setErrorMessage('Der Termin konnte nicht erstellt werden. Bitte überprüfe deine Eingaben.');
                                    console.error(err);
                                }
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><path d="m9 16 2 2 4-4"/></svg>
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </div>
    );
};

export default Kalender;
